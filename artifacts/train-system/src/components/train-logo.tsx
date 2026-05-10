import metroLogo from "@/assets/metro-logo.png";

export function TrainLogo({ size = 80 }: { size?: number }) {
  return (
    <img
      src={metroLogo}
      width={size}
      height={size}
      alt="Riyadh Metro"
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
