'use server'

export async function testAction(formData: FormData) {
  return { message: "Action executed", timestamp: Date.now() };
}
