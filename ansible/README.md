# Smart Umuganda — Configuration Management (Ansible)

This directory contains the Ansible automation that configures the EC2 instance
provisioned by Terraform (see [`../terraform`](../terraform)) and deploys the
containerized **Smart Umuganda** application onto it.

Terraform now provisions a **bare** instance (no cloud-init bootstrap) — Ansible
is the single source of truth for everything that happens *on* the server:
dependencies, security hardening, and the application itself.

---

## What the playbook does

The playbook (`site.yml`) is organised into four **roles**, applied in order:

| Role | Responsibility |
|------|----------------|
| `common` | Base packages (`git`, `curl`, …) and a swap file so low-memory builds don't OOM |
| `docker` | Installs Docker Engine + Compose plugin from Docker's official apt repo; enables the service |
| `security` | **UFW** firewall (default-deny inbound, allow 22/80/8000), **SSH hardening** (key-only, no root, limited retries), plus **fail2ban** and **unattended-upgrades** |
| `app` | Clones the repo, renders `.env` + a compose file, builds and runs the backend + frontend containers against RDS, and waits for health checks to pass |

Everything is **idempotent** — re-running the playbook converges the server to
the desired state without unnecessary changes.

---

## Layout

```
ansible/
├── ansible.cfg                    # defaults: inventory, SSH user/key, become
├── requirements.yml               # Galaxy collections to install
├── site.yml                       # main playbook (wires the roles)
├── inventory/
│   ├── hosts.ini                  # static inventory (edit the IP)
│   └── aws_ec2.yml                # dynamic inventory (discovers by AWS tag)
├── group_vars/
│   └── all/
│       ├── main.yml               # non-secret variables
│       └── vault.yml.example      # secrets template (copy → vault.yml, encrypt)
└── roles/
    ├── common/                    # base packages + swap
    ├── docker/                    # Docker Engine + Compose plugin
    ├── security/                  # UFW + SSH hardening + fail2ban
    └── app/                       # deploy the containerized application
```

---

## Prerequisites

1. **Ansible** ≥ 2.15 (`pip install ansible` or `brew install ansible`).
2. **The infrastructure already provisioned** by Terraform, and its SSH private
   key present at `../terraform/smart-umuganda-key` (this is what `ansible.cfg`
   uses to connect).
3. **Galaxy collections** used by the roles/inventory:
   ```bash
   ansible-galaxy collection install -r requirements.yml
   ```
4. For the **dynamic** inventory only: `pip install boto3` and AWS credentials
   in your environment (the same ones Terraform uses).

---

## Configure

All the values Ansible needs come straight from Terraform's outputs.

### 1. Point the inventory at your instance

**Static** — edit `inventory/hosts.ini` and set the public IP:
```bash
terraform -chdir=../terraform output -raw instance_public_ip
```

**Dynamic (recommended)** — no editing needed; `inventory/aws_ec2.yml`
discovers the instance by its `Project = smart-umuganda` tag.

### 2. Set the database host (non-secret)

Edit `group_vars/all/main.yml` and set `db_host`:
```bash
terraform -chdir=../terraform output -raw db_address
```

### 3. Provide secrets via Ansible Vault

```bash
cp group_vars/all/vault.yml.example group_vars/all/vault.yml

# Fill in the values:
terraform -chdir=../terraform output -raw db_password   # -> vault_db_password
# vault_jwt_secret: any long random string, e.g.:
openssl rand -hex 32

# Encrypt the file so it is safe to commit:
ansible-vault encrypt group_vars/all/vault.yml
```

> `vault.yml` (unencrypted) is git-ignored. Only the encrypted file should ever
> be committed.

---

## Run the playbook

Static inventory:
```bash
ansible-playbook site.yml --ask-vault-pass
```

Dynamic AWS inventory:
```bash
ansible-playbook -i inventory/aws_ec2.yml site.yml --ask-vault-pass
```

Useful variations:
```bash
# Check connectivity first
ansible -m ping app

# Dry run (no changes), then show what would change
ansible-playbook site.yml --check --diff --ask-vault-pass

# Only re-run one part (tags: common, docker, security, app/deploy)
ansible-playbook site.yml --tags deploy --ask-vault-pass

# Syntax check only
ansible-playbook site.yml --syntax-check
```

When it finishes, the app is reachable at:

- Frontend: `http://<instance_public_ip>/`
- API health: `http://<instance_public_ip>:8000/health`

The `app` role blocks until both health checks return `200`, so a successful
run means the application is actually up.

---

## How this fits with Terraform

```
terraform apply           # provision VPC, security groups, bare EC2, RDS
      │
      ├─ outputs: instance_public_ip, db_address, db_password, ...
      ▼
ansible-playbook site.yml # install Docker, harden, deploy the app
```

Terraform owns **infrastructure**; Ansible owns **configuration + deployment**.
Re-run the playbook any time you push new code — it pulls the latest commit,
rebuilds the images, and rolls the containers.

---

## Security hardening applied

- **UFW**: default-deny inbound; only SSH (22), frontend (80) and API (8000) open.
- **SSH**: password and root login disabled, key-only auth, `MaxAuthTries 3`,
  idle-session timeouts. The config is validated with `sshd -t` before the
  service is restarted, so a bad config can never lock you out.
- **fail2ban**: bans IPs that brute-force SSH.
- **unattended-upgrades**: applies security patches automatically.

> Tighten SSH further by restricting port 22 to your IP at the AWS security
> group level (Terraform's `ssh_allowed_cidr`).
