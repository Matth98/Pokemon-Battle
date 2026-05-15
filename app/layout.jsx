import './globals.css'

export const metadata = {
  title: 'PokéBattle',
  description: 'Suivi Champions Pokémon',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
