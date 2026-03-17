#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";

const script = path.join(process.cwd(), "scripts", "generate-catbond-datasets.mjs");
const child = spawn(process.execPath, [script, "--scope=seismic"], { stdio: "inherit" });

child.on("exit", (code) => process.exit(code ?? 0));
