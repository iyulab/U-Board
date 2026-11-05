#!/usr/bin/env node
import { runRender } from './render-cli.js';

process.exitCode = await runRender(process.argv.slice(2));
