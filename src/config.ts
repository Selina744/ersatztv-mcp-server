const ERSATZTV_URL = process.env.ERSATZTV_URL;

if (!ERSATZTV_URL) {
  console.error("[Error] ERSATZTV_URL environment variable is required.");
  process.exit(1);
}

// Strip trailing slash
export const baseUrl = ERSATZTV_URL.replace(/\/+$/, '');
