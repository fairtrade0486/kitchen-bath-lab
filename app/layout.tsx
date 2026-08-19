import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 minimumScale: 1,
 maximumScale: 5,
 userScalable: true,
 viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
 const requestHeaders = await headers();
 const host = requestHeaders.get("host") ?? "localhost:3000";
 const protocol = host.startsWith("localhost") ? "http" : "https";
 const image = `${protocol}://${host}/og.png`;
 return {
 title: "욕실·주방 부분청소 | KITCHEN & BATH_LAB",
 description: "매칭하지 않습니다. 욕실, 한곳에 집중하는 영종지역 1인 부분청소 서비스.",
 openGraph: { title: "집 전체를 청소하지 않습니다.", description: "욕실, 한곳에 집중하는 영종지역 1:1 홈케어", images: [image], locale: "ko_KR", type: "website" },
 twitter: { card: "summary_large_image", images: [image] },
 };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="ko"><body>{children}</body></html>;
}
