import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private serialize(message: unknown, level: LogLevel, context?: string) {
    return JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      context: context ?? this.context,
      message,
    });
  }

  override log(message: unknown, context?: string): void {
    process.stdout.write(`${this.serialize(message, 'log', context)}\n`);
  }

  override error(message: unknown, stack?: string, context?: string): void {
    process.stderr.write(
      `${JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        context: context ?? this.context,
        message,
        stack,
      })}\n`,
    );
  }

  override warn(message: unknown, context?: string): void {
    process.stdout.write(`${this.serialize(message, 'warn', context)}\n`);
  }
}
