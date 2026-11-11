import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'

/**
 * Minimal terminal prompts. Passwords are not echoed when run in a terminal.
 * When stdin is piped (not a TTY), answers are read line by line.
 */
export function createPrompt() {
  let muted = false
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding)
      callback()
    },
  })
  const rl = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) })

  return {
    ask: (question: string) => rl.question(question),
    async askHidden(question: string) {
      process.stdout.write(question)
      muted = true
      try {
        return await rl.question('')
      } finally {
        muted = false
        process.stdout.write('\n')
      }
    },
    close: () => rl.close(),
  }
}
