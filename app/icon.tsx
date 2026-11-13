import { markImage } from "./mark-image";

export const contentType = "image/png";

export function generateImageMetadata() {
  return [32, 192, 512].map(n => ({ id: String(n), size: { width: n, height: n }, contentType }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  // The favicon gets rounded corners; the install icons are square so the OS can mask them.
  return markImage(size, { rounded: size <= 32 });
}
