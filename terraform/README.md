# Smart Umuganda — Infrastructure as Code (Terraform)

This directory contains the Terraform configuration that provisions the AWS
infrastructure for the **Smart Umuganda** application (Express API + React
frontend + PostgreSQL).

The configuration is **modular**: the root module wires together four
purpose-built child modules under `modules/`. Everything environment-specific
is driven by input **variables**, and the key facts you need after a deploy are
surfaced as **outputs**. No secrets or region names are hardcoded.

---

## What gets provisioned

| Layer | Resource | Module |
|-------|----------|--------|
| **Network** | VPC, Internet Gateway, 2 public + 2 private subnets (across 2 AZs), route tables | `modules/network` |
| **Security** | Application security group (HTTP / API / SSH) and database security group (PostgreSQL from the app tier only) | `modules/security` |
| **Compute** | EC2 instance (Ubuntu 24.04) with a static Elastic IP, provisioned bare — Docker, hardening and app deployment are handled by Ansible (see [`../ansible`](../ansible)) | `modules/compute` |
| **Database** | Managed PostgreSQL (RDS) in private subnets, encrypted, not publicly accessible | `modules/database` |

### Architecture

```
                    Internet
                        │
                 ┌──────▼───────┐
                 │ Internet GW  │
                 └──────┬───────┘
   VPC 10.0.0.0/16      │
 ┌──────────────────────┼───────────────────────────────┐
 │  Public subnets      │           Private subnets      │
 │  10.0.1.0/24 (AZ-a)  │           10.0.101.0/24 (AZ-a) │
 │  10.0.2.0/24 (AZ-b)  │           10.0.102.0/24 (AZ-b) │
 │                      │                                │
 │   ┌──────────────────▼─────┐        ┌───────────────┐ │
 │   │ EC2 (app-sg)           │  5432  │ RDS Postgres  │ │
 │   │  • frontend  :80       ├───────►│  (db-sg)      │ │
 │   │  • backend   :8000      │        │  private only │ │
 │   │  • Elastic IP          │        └───────────────┘ │
 │   └────────────────────────┘                          │
 └───────────────────────────────────────────────────────┘

app-sg  ingress: 80, 8000 (world), 22 (ssh_allowed_cidr)
db-sg   ingress: 5432 from app-sg only  (no public access)
```

---

## Layout

```
terraform/
├── versions.tf              # Terraform + provider version constraints
├── providers.tf             # AWS provider + default tags
├── variables.tf             # All input variables (with validation)
├── main.tf                  # Root module: wires the child modules, derives secrets
├── outputs.tf               # Exposed outputs (IPs, IDs, URLs)
├── terraform.tfvars.example # Copy to terraform.tfvars and customise
└── modules/
    ├── network/             # VPC, subnets, IGW, route tables
    ├── security/            # Security groups
    ├── compute/             # EC2 instance + Elastic IP
    └── database/            # RDS PostgreSQL + subnet group
```

---

## Prerequisites

1. **Terraform** ≥ 1.5 — <https://developer.hashicorp.com/terraform/install>
2. **AWS account** and credentials configured for the CLI. Any of:
   ```bash
   aws configure                         # interactive
   # or
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   export AWS_REGION=us-east-1
   ```
3. (Optional) An SSH key pair if you want shell access to the instance:
   ```bash
   ssh-keygen -t ed25519 -f ./smart-umuganda-key
   # then set ssh_public_key to the contents of smart-umuganda-key.pub
   ```

---

## Required IAM permissions

The credentials you run Terraform with need permission to manage the VPC,
EC2/EIP, security groups and RDS resources this configuration creates (state is
local, so no S3/DynamoDB access is required). Two options:

**Option A — scoped custom policy (recommended).** A ready-to-use policy
document lives at [`iam-policy.json`](./iam-policy.json). Attach it to your IAM
user:

```bash
aws iam put-user-policy \
  --user-name YOUR_IAM_USER \
  --policy-name SmartUmugandaTerraform \
  --policy-document file://iam-policy.json
```

The policy is organised into six statements, each scoped to what a specific
part of the deployment needs:

| Sid | Grants | Used by |
|-----|--------|---------|
| `PreflightAndDiscovery` | `sts:GetCallerIdentity`, `ec2:DescribeAccountAttributes`, `DescribeAvailabilityZones`, `DescribeImages`, `DescribeTags` | Provider auth + the AZ/AMI data sources |
| `Networking` | Create/Delete/Describe for VPC, subnets, internet gateway, route tables (+ associations) | `modules/network` |
| `SecurityGroups` | Create/Delete/Describe security groups and authorize/revoke/modify their rules | `modules/security` |
| `ComputeAndEip` | Run/Terminate/Stop/Start/Reboot instances, key pairs, Elastic IPs (allocate/associate + attribute reads), instance metadata options, volume/ENI describe, tags | `modules/compute` |
| `RdsServiceLinkedRole` | `iam:CreateServiceLinkedRole`, conditioned to `rds.amazonaws.com` only | One-time creation of `AWSServiceRoleForRDS` (see note below) |
| `Database` | Create/Delete/Modify/Describe RDS instances and DB subnet groups, plus tag actions | `modules/database` |

`Resource: "*"` is used for the EC2/RDS statements because their `Describe*`
actions don't support resource-level scoping. Tighten the create/modify/delete
statements with an `aws:RequestedRegion` condition if you want to constrain it
further. The `RdsServiceLinkedRole` statement is already tightly scoped by both
resource ARN and the `iam:AWSServiceName` condition.

> **Service-linked role note.** RDS needs an account-level role,
> `AWSServiceRoleForRDS`, that normally auto-creates on first use — hence the
> `RdsServiceLinkedRole` statement. If your user can't be granted
> `iam:CreateServiceLinkedRole`, an admin can create it once instead, after
> which that statement becomes unnecessary:
> ```bash
> aws iam create-service-linked-role --aws-service-name rds.amazonaws.com
> ```

**Option B — AWS-managed policies (fastest, broader).** Attach
`AmazonEC2FullAccess` and `AmazonRDSFullAccess` to the user instead
(`AmazonRDSFullAccess` already covers the service-linked role).

---

## Initialize and apply

From this `terraform/` directory:

```bash
# 1. Create your variable file from the template
cp terraform.tfvars.example terraform.tfvars
#    edit terraform.tfvars as needed (region, instance size, SSH key, ...)

# 2. Download providers and initialise the working directory
terraform init

# 3. (Recommended) Sanity-check formatting and configuration
terraform fmt -recursive
terraform validate

# 4. Preview the changes
terraform plan

# 5. Create the infrastructure
terraform apply
#    review the plan, then type "yes"
```

Apply takes a few minutes (RDS provisioning dominates). When it finishes, the
outputs are printed — e.g.:

```
application_url            = "http://203.0.113.10"
api_url                    = "http://203.0.113.10:8000/api"
instance_public_ip         = "203.0.113.10"
db_endpoint                = "smart-umuganda-dev-postgres.abc123.us-east-1.rds.amazonaws.com:5432"
...
```

Terraform provisions a bare instance. Run the Ansible playbook (see
[`../ansible`](../ansible)) to install Docker, harden the host, and deploy the
application. The outputs above feed straight into Ansible's configuration.

### Handling secrets

Nothing sensitive is hardcoded:

- `db_password` is **auto-generated** with the `random` provider when you don't
  supply one.
- To pin it, pass it via the environment (never a committed file):
  ```bash
  export TF_VAR_db_password='your-strong-password'
  terraform apply
  ```

Retrieve generated values later:

```bash
terraform output -raw database_connection_string
```

`terraform.tfvars` and all `*.tfvars` files are git-ignored so real values
never land in version control.

---

## Inputs (key variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | Region for all resources |
| `project_name` | `smart-umuganda` | Name/tag prefix |
| `environment` | `dev` | `dev` \| `staging` \| `prod` |
| `vpc_cidr` | `10.0.0.0/16` | VPC CIDR |
| `public_subnet_cidrs` | `10.0.1.0/24`, `10.0.2.0/24` | App-tier subnets |
| `private_subnet_cidrs` | `10.0.101.0/24`, `10.0.102.0/24` | DB-tier subnets |
| `instance_type` | `t3.small` | EC2 size |
| `ssh_public_key` | `""` | Public key; empty disables SSH |
| `ssh_allowed_cidr` | `0.0.0.0/0` | CIDR allowed to SSH (restrict this!) |
| `db_instance_class` | `db.t3.micro` | RDS size |
| `db_allocated_storage` | `20` | GiB |
| `db_engine_version` | `16` | PostgreSQL major version |
| `db_password` | auto-generated | Supply via `TF_VAR_db_password` to pin |

See `variables.tf` for the complete, documented list.

## Outputs

| Output | Description |
|--------|-------------|
| `application_url` | Frontend URL |
| `api_url` | Backend API base URL |
| `instance_public_ip` | Static Elastic IP of the app host |
| `instance_id` | EC2 instance ID |
| `vpc_id`, `public_subnet_ids`, `private_subnet_ids` | Network IDs |
| `app_security_group_id`, `db_security_group_id` | Security group IDs |
| `db_endpoint`, `db_identifier` | Database connection endpoint / ID |
| `database_connection_string` | Full connection string (marked **sensitive**) |
| `ssh_command` | Ready-to-run SSH command (if a key was set) |

---

## Destroy

Tear everything down when you're done to avoid ongoing charges:

```bash
terraform destroy
```

---

## Notes & design choices

- **Modular** — each concern (network / security / compute / database) is an
  independent, reusable module with its own variables and outputs.
- **Security groups as NSGs** — AWS security groups are the direct equivalent of
  Azure NSGs. The database group only accepts traffic *from the application
  group*, so PostgreSQL is never exposed to the internet.
- **No NAT gateway** — private subnets deliberately have no internet route
  (RDS doesn't need one), which keeps the demo cheap.
- **IMDSv2 enforced** and EBS/RDS storage encrypted as baseline hardening.
- **Cost awareness** — defaults (`t3.small`, `db.t3.micro`, single-AZ,
  `skip_final_snapshot`) target a low-cost coursework environment. For
  production, raise the instance sizes, set `multi_az = true`,
  `deletion_protection = true`, and remote state (S3 + DynamoDB lock).
```
