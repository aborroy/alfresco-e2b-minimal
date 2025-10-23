# alfresco-e2b-minimal

Run untrusted or AI-generated Python analysis safely on **Alfresco documents** using [**E2B**](https://e2b.dev) ephemeral sandboxes

This project shows how to offload code execution from your host to a fully isolated Firecracker VM, analyze a document, and send the results back to Alfresco **without exposing credentials** or building custom microservices

## Overview

The app connects to your Alfresco repository, downloads a document by its `nodeId`, starts an **E2B sandbox**, copies a Python script and the document into it, executes the script remotely, retrieves the generated JSON, and uploads it as a new node in a target folder

It’s a lightweight demonstration of how E2B complements Docker for secure, short-lived code execution

## Requirements

Before running this project, ensure you have:

| Component | Description |
|------------|-------------|
| Alfresco Repository | Any running instance (Community or Enterprise) accessible via REST API |
| E2B Account & API Key | Create one at [e2b.dev](https://e2b.dev/dashboard/account/settings?tab=keys) |
| Node.js 18+ | Local runtime for the orchestrator script |
| Docker (optional) | To run the included containerized version |

## Environment Configuration

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Example `.env` content:

```ini
# Alfresco instance
ALFRESCO_BASE_URL=http://localhost:8080/alfresco
ALFRESCO_USERNAME=admin
ALFRESCO_PASSWORD=admin

# The Alfresco folder where results will be uploaded
TARGET_FOLDER_ID=2b6ad58e-0d12-4a11-a9e2-b145c89a4321

# Document to analyze (nodeId)
SOURCE_NODE_ID=3d0014d0-6232-4af1-8014-d062327af1c5

# E2B API Key
E2B_API_KEY=your_e2b_api_key_here
```

> Note: Alfresco credentials are used only by the host app.  
> The sandbox never receives tokens, URLs, or any secret.

## Project Structure

```
.
├── compose.yaml              # Docker Compose file for containerized execution
├── Dockerfile                # Node-based runtime for the orchestrator
├── scripts/
│   └── basic_stats.py        # Default analysis script (word, line, byte count)
├── src/                      # TypeScript orchestrator
├── .env.example              # Environment template
└── README.md
```

## Running the project

### Option 1: Local execution

```bash
npm install
cp .env.example .env
# Edit .env values
npm start
```

### Option 2: Dockerized execution

```bash
cp .env.example .env
# Edit .env values
docker compose up --build
```

Expected output:

```
✓ Analysis uploaded.
  Source node: 3d0014d0-6232-4af1-8014-d062327af1c5
  Result node: f6b01cfb-492c-4576-b01c-fb492c1576b1
```

## What happens under the hood

1. Authenticate to Alfresco using the REST API  
2. Download the document content locally  
3. Create an E2B sandbox via the [E2B TypeScript SDK](https://e2b.dev/docs/quickstart)  
4. Copy the Python script (`scripts/basic_stats.py`) and document content into the sandbox  
5. Run the script remotely with:
   ```ts
   await sb.commands.run('python /work/basic_stats.py')
   ```
6. Retrieve the JSON output from the sandbox  
7. Upload the result to Alfresco as a new node in `TARGET_FOLDER_ID`  

Sample result file content:

```json
{
  "bytes": 13452,
  "words": 2164,
  "lines": 238
}
```

## Customizing your analysis

You can replace `scripts/basic_stats.py` with your own logic or event with **AI-generated code**

Guidelines:

- Read the input document from the `INPUT_PATH` environment variable  
- Write results as JSON to the file at `OUTPUT_PATH`  
- Avoid external network calls unless explicitly needed  

Example advanced use cases:

- Extract invoice fields using regular expressions  
- Detect PII with `presidio` or `re`  
- Generate embeddings or summaries with a local LLM SDK  

## Why E2B

| Feature | Benefit |
|----------|----------|
| Firecracker Sandboxes | Instant, secure microVMs for code execution |
| Isolation | No network or filesystem access to the host |
| Language-agnostic | Run Python, JS, or CLI tools with a single SDK call |
| Serverless simplicity | No image builds or container lifecycle management |

> Learn more in the official docs:  
> - [E2B Quickstart](https://e2b.dev/docs/quickstart)  
> - [E2B Sandbox Reference](https://e2b.dev/docs/sandbox)

## Extending this project

- Trigger sandbox executions on Alfresco **Content Events**
- Chain **OCR** or **metadata extractors** as trusted Docker services
- Cache repeated analyses using content hashes
- Build dashboards from stored JSON results