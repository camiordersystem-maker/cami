// A deadline bounds UI waiting; it does not cancel a committed server operation.
export async function withDeadline<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), milliseconds); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
