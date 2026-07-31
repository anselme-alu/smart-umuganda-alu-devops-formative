terraform {
  # Remote state, supplied as a *partial* configuration so the bucket/key/region
  # are not baked into the repository.
  #
  #   CI/CD  — .github/workflows/cd.yaml passes them via `-backend-config=...`
  #   Local  — cp backend.hcl.example backend.hcl (fill it in), then:
  #              terraform init -backend-config=backend.hcl
  #
  # `use_lockfile` uses S3-native conditional writes for state locking, so no
  # DynamoDB table is required.
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
