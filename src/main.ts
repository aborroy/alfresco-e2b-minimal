// src/main.ts
import { Sandbox } from '@e2b/code-interpreter';
import axios from 'axios';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { cfg } from './config.js';
import { Alfresco } from './alfresco.js';

type Argv = { nodeId: string; script: string; outputName?: string };

const argv = yargs(hideBin(process.argv))
  .option('nodeId', { type: 'string', demandOption: true })
  .option('script', { type: 'string', demandOption: true, desc: 'Path to a Python script to run in sandbox' })
  .option('outputName', { type: 'string', desc: 'Base name for output JSON in Alfresco' })
  .parseSync() as Argv;

(async () => {
  // 1) Auth + get content bytes (creds never enter the sandbox)
  const af = new Alfresco(cfg.alfrescoBaseUrl, cfg.authMode, {
    username: cfg.username,
    password: cfg.password,
    bearer: cfg.bearer
  });
  await af.auth();

  const nodeId = argv.nodeId;
  const contentUrl = af.contentUrl(nodeId);
  const bytes = (await axios.get<ArrayBuffer>(contentUrl, { responseType: 'arraybuffer' })).data;
  const buf = Buffer.from(bytes as any);

  // 2) Start E2B sandbox
  const sb = await Sandbox.create({ apiKey: cfg.e2bApiKey });

  try {
    // 3) Push inputs + script
    await sb.files.write('/work/input.bin', buf);
    const fs = await import('node:fs/promises');
    const scriptBytes = await fs.readFile(argv.script);
    await sb.files.write('/work/analysis.py', scriptBytes);

    // 4) Run Python inside the sandbox
    const run = await sb.commands.run('python /work/analysis.py', {
      timeout: 60_000,
      env: { INPUT_PATH: '/work/input.bin', OUTPUT_PATH: '/work/out.json' }
    });

    if (run.exitCode !== 0) {
      console.error('Sandbox STDOUT:', run.stdout);
      console.error('Sandbox STDERR:', run.stderr);
      throw new Error(`Sandbox failed with exitCode=${run.exitCode}`);
    }

    // 5) Read result & upload to Alfresco
    const out = await sb.files.read('/work/out.json');
    const base = argv.outputName ?? `${nodeId}_analysis`;

    const newId = await af.uploadChild(
      cfg.targetFolderId,
      `${base}.json`,
      Buffer.from(out)
    );

    // 6) Set standard cm: properties (no custom model)
    await af.setProperties(newId, {
      'cm:title': `Analysis for ${nodeId}`,
      'cm:description': 'Basic statistics generated in an E2B sandbox',
      'cm:author': 'E2B Sandbox'
    });

    console.log('✓ Analysis uploaded.');
    console.log(`  Source node: ${nodeId}`);
    console.log(`  Result node: ${newId}`);
  } finally {
    // 7) Properly terminate the sandbox
    await sb.kill();
  }
})().catch((e: any) => {
  if (e?.response?.data) {
    console.error('Alfresco error:', JSON.stringify(e.response.data, null, 2));
  }
  console.error(e);
  process.exit(1);
});
