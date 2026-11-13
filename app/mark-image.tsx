import { ImageResponse } from "next/og";

/** The app mark (a white × on near-black) as a PNG, for icons. */
export function markImage(size: number, { rounded }: { rounded: boolean }) {
  const stroke = Math.round(size * 0.07);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 256 256">
          <path d="M88 88 L168 168 M168 88 L88 168" stroke="white" strokeWidth={(stroke / size) * 256} strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
