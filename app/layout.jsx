import './globals.css'

export const metadata = {
  title: 'PokéBattle',
  description: 'Suivi Champions Pokémon',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
