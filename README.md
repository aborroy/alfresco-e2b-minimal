# alfresco-e2b-minimal

Run untrusted AI analysis safely on Alfresco documents with **E2B**.

## What it does

1. Auth to Alfresco (ticket or bearer)
2. Download a document by `nodeId`
3. Spin up an **E2B sandbox** and copy the document + a Python analysis script into it
4. Execute the script in the sandbox
5. Upload the JSON result to a target Alfresco folder

## Prereqs

- Node 18+ or Docker
- Alfresco instance and a folder to store analysis (`TARGET_FOLDER_ID`)
- E2B API key

> Create E2B API key from your "account" at https://e2b.dev/dashboard/account/settings?tab=keys

## Setup

```bash
cp .env.example .env
# edit .env with Alfresco URL/creds, target folder, node id and E2B key
npm install
```

## Run (Docker)

```bash
docker compose up --build
```

## Swap in your own analysis

Replace `scripts/basic_stats.py` with any Python. Read the input from `INPUT_PATH`, write results to `OUTPUT_PATH` (JSON). The sandbox boundary ensures untrusted code cannot touch your host

## Notes

* Credentials are never injected into the sandbox; the host downloads content and only the bytes enter the sandbox
* You can tag the uploaded JSON with your own custom model properties

## Suggested next steps

* Trigger on Alfresco events
* Add OCR/Tika as trusted services (keep untrusted code in E2B)
* Cache by content hash