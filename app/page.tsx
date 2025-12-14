import { testAction } from './actions/test';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CVE-2025-55182 Vulnerable Lab</h1>
      <div className="bg-yellow-100 border-2 border-yellow-500 rounded p-4 mb-4">
        <p className="font-bold text-red-600">⚠️ VULNERABLE ENVIRONMENT</p>
        <p>React 19 RC + Next.js 15.0.0</p>
        <p>Node.js Runtime with Brotli Support</p>
      </div>
      <form action={testAction}>
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Server Action
        </button>
      </form>
    </div>
  );
}
