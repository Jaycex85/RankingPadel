export const metadata = {
  title: "RankingPadel",
  description: "Verification de classement padel multi-federations (AFP, PWB, Tennis Vlaanderen)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
