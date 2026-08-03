/**
 * CLI bootstrap — parse argv and delegate.
 */
import { main } from "./run";

main(process.argv.slice(2)).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
