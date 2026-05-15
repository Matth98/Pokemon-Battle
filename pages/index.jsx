import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Download, Search, X, BarChart3 } from 'lucide-react';

const PokemonBattleLogger = () => {
  const [players, setPlayers] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [homeTab, setHomeTab] = useState('players');
  const [pokemonView, setPokemonView] = useState('grid');
  const [pokemonSearch, setPokemonSearch] = useState('');
  const [loadingImages, setLoadingImages] = useState({});

  // Charger les données du localStorage au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('pokebattle_players');
    if (saved) {
      try {
        setPlayers(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
      }
    }
  }, []);

  // Sauvegarder les données dans le localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('pokebattle_players', JSON.stringify(players));
  }, [players]);

  // Types Pokémon avec couleurs
  const pokemonTypes = {
    normal: { name: 'Normal', color: '#A8A878' },
    fire: { name: 'Feu', color: '#F08030' },
    water: { name: 'Eau', color: '#6890F0' },
    electric: { name: 'Électrique', color: '#F8D030' },
    grass: { name: 'Plante', color: '#78C850' },
    ice: { name: 'Glace', color: '#98D8D8' },
    fighting: { name: 'Combat', color: '#C03028' },
    poison: { name: 'Poison', color: '#A040A0' },
    ground: { name: 'Sol', color: '#E0C068' },
    flying: { name: 'Vol', color: '#A890F0' },
    psychic: { name: 'Psy', color: '#F85888' },
    bug: { name: 'Insecte', color: '#A8B820' },
    rock: { name: 'Roche', color: '#B8A038' },
    ghost: { name: 'Spectre', color: '#705898' },
    dragon: { name: 'Dragon', color: '#7038F8' },
    dark: { name: 'Ténèbres', color: '#705848' },
    steel: { name: 'Acier', color: '#B8B8D0' },
    fairy: { name: 'Fée', color: '#EE99AC' },
  };

  // Pokémon Champions - données + images via cdn.jsdelivr.net (CORS-friendly)
  const getPokemonImageUrl = (id) => {
    return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  const allPokemon = [
    { id: 'pikachu', name: 'Pikachu', pokeId: 25, types: ['electric'], stats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 } },
    { id: 'charizard', name: 'Charizard', pokeId: 6, types: ['fire', 'flying'], stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 } },
    { id: 'blastoise', name: 'Blastoise', pokeId: 9, types: ['water'], stats: { hp: 79, atk: 83, def: 100, spa: 83, spd: 100, spe: 78 } },
    { id: 'venusaur', name: 'Venusaur', pokeId: 3, types: ['grass', 'poison'], stats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 } },
    { id: 'dragonite', name: 'Dragonite', pokeId: 149, types: ['dragon', 'flying'], stats: { hp: 91, atk: 134, def: 95, spa: 100, spd: 100, spe: 80 } },
    { id: 'alakazam', name: 'Alakazam', pokeId: 65, types: ['psychic'], stats: { hp: 55, atk: 50, def: 65, spa: 135, spd: 95, spe: 120 } },
    { id: 'machamp', name: 'Machamp', pokeId: 68, types: ['fighting'], stats: { hp: 90, atk: 130, def: 80, spa: 65, spd: 85, spe: 55 } },
    { id: 'golem', name: 'Golem', pokeId: 76, types: ['rock', 'ground'], stats: { hp: 80, atk: 120, def: 130, spa: 55, spd: 65, spe: 45 } },
    { id: 'arcanine', name: 'Arcanine', pokeId: 59, types: ['fire'], stats: { hp: 90, atk: 110, def: 80, spa: 80, spd: 80, spe: 95 } },
    { id: 'lapras', name: 'Lapras', pokeId: 131, types: ['water', 'ice'], stats: { hp: 130, atk: 85, def: 80, spa: 85, spd: 95, spe: 60 } },
    { id: 'gengar', name: 'Gengar', pokeId: 94, types: ['ghost', 'poison'], stats: { hp: 45, atk: 50, def: 75, spa: 130, spd: 95, spe: 110 } },
    { id: 'raichu', name: 'Raichu', pokeId: 26, types: ['electric'], stats: { hp: 60, atk: 90, def: 55, spa: 90, spd: 80, spe: 110 } },
    { id: 'weavile', name: 'Weavile', pokeId: 461, types: ['dark', 'ice'], stats: { hp: 70, atk: 120, def: 65, spa: 45, spd: 85, spe: 125 } },
    { id: 'garchomp', name: 'Garchomp', pokeId: 445, types: ['dragon', 'ground'], stats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 } },
    { id: 'blaziken', name: 'Blaziken', pokeId: 257, types: ['fire', 'fighting'], stats: { hp: 80, atk: 120, def: 72, spa: 110, spd: 90, spe: 80 } },
    { id: 'rotom-wash', name: 'Rotom-Wash', pokeId: 479, types: ['electric', 'water'], stats: { hp: 50, atk: 65, def: 107, spa: 105, spd: 107, spe: 86 } },
    { id: 'heatran', name: 'Heatran', pokeId: 485, types: ['fire', 'steel'], stats: { hp: 91, atk: 90, def: 106, spa: 130, spd: 106, spe: 77 } },
    { id: 'landorus-therian', name: 'Landorus-T', pokeId: 645, types: ['ground', 'flying'], stats: { hp: 89, atk: 145, def: 90, spa: 105, spd: 80, spe: 91 } },
    { id: 'incineroar', name: 'Incineroar', pokeId: 727, types: ['fire', 'dark'], stats: { hp: 95, atk: 115, def: 90, spa: 80, spd: 90, spe: 72 } },
    { id: 'corviknight', name: 'Corviknight', pokeId: 823, types: ['flying', 'steel'], stats: { hp: 98, atk: 87, def: 95, spa: 53, spd: 82, spe: 67 } },
    { id: 'grimmsnarl', name: 'Grimmsnarl', pokeId: 861, types: ['dark', 'fairy'], stats: { hp: 120, atk: 130, def: 90, spa: 80, spd: 110, spe: 45 } },
    { id: 'iron-hand', name: 'Iron Hand', pokeId: 1016, types: ['fighting', 'electric'], stats: { hp: 58, atk: 134, def: 106, spa: 103, spd: 85, spe: 104 } },
    { id: 'pecharunt', name: 'Pecharunt', pokeId: 1025, types: ['poison', 'ghost'], stats: { hp: 70, atk: 110, def: 70, spa: 130, spd: 100, spe: 110 } },
  ];

  const TypeSticker = ({ type }) => {
    const typeData = pokemonTypes[type] || { name: type, color: '#A8A878' };
    return (
      <span
        style={{ backgroundColor: typeData.color }}
        className="text-white text-xs font-bold px-2 py-1 rounded-full inline-block"
      >
        {typeData.name}
      </span>
    );
  };

  const PokemonImage = ({ pokemon }) => {
    const [error, setError] = useState(false);
    const imageUrl = getPokemonImageUrl(pokemon.pokeId);

    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-4xl">🔷</div>
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={pokemon.name}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
        onLoad={() => setLoadingImages(prev => ({ ...prev, [pokemon.id]: false }))}
      />
    );
  };

  const HomeView = () => {
    const filteredPokemon = allPokemon.filter((p) =>
      p.name.toLowerCase().includes(pokemonSearch.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 mt-6">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">PokéBattle</h1>
            <p className="text-white text-sm drop-shadow font-bold">Suivi Champions Pokémon</p>
          </div>

          <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-md">
            <button
              onClick={() => setHomeTab('players')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                homeTab === 'players'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              👥 Joueurs
            </button>
            <button
              onClick={() => setHomeTab('pokemons')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                homeTab === 'pokemons'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              🎯 Pokémon
            </button>
          </div>

          {homeTab === 'players' ? (
            <>
              {players.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun joueur</h2>
                  <p className="text-gray-600 mb-6">Commencez par ajouter un joueur</p>
                  <button
                    onClick={() => setShowNewPlayerForm(true)}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
                  >
                    Ajouter un joueur
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {players.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setCurrentView('player');
                      }}
                      className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
                          <p className="text-sm text-gray-500">
                            <span className="text-green-600 font-bold">{player.stats.wins}W</span>
                            {' - '}
                            <span className="text-red-600 font-bold">{player.stats.losses}L</span>
                            {' | '}
                            {player.pokemon.length} Pokémon
                          </p>
                        </div>
                        <ChevronRight className="text-red-500" />
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewPlayerForm(true)}
                    className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition text-center font-bold text-red-500 border-2 border-red-300 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Nouveau joueur
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-white text-sm font-bold text-center mb-3">
                {allPokemon.length} Pokémon Champions disponibles
              </p>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Chercher un Pokémon..."
                  value={pokemonSearch}
                  onChange={(e) => setPokemonSearch(e.target.value)}
                  className="w-full border-2 border-white rounded-xl px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm bg-white text-gray-800"
                  autoComplete="off"
                />
                {pokemonSearch && (
                  <button
                    onClick={() => setPokemonSearch('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPokemonView('grid')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                    pokemonView === 'grid'
                      ? 'bg-white text-red-500'
                      : 'bg-white bg-opacity-50 text-white hover:bg-opacity-70'
                  }`}
                >
                  ⊞ Grille
                </button>
                <button
                  onClick={() => setPokemonView('list')}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
                    pokemonView === 'list'
                      ? 'bg-white text-red-500'
                      : 'bg-white bg-opacity-50 text-white hover:bg-opacity-70'
                  }`}
                >
                  ≡ Liste
                </button>
              </div>

              {filteredPokemon.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center">
                  <p className="text-gray-600">Aucun Pokémon trouvé</p>
                </div>
              ) : pokemonView === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredPokemon.map((poke) => (
                    <div
                      key={poke.id}
                      className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-2 p-2 flex items-center justify-center">
                        <PokemonImage pokemon={poke} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1 text-center">{poke.name}</h3>
                      <div className="flex gap-1 mb-2 flex-wrap justify-center">
                        {poke.types.map((type) => (
                          <TypeSticker key={type} type={type} />
                        ))}
                      </div>
                      <div className="text-xs text-gray-600 grid grid-cols-3 gap-1">
                        <div className="bg-gray-50 p-1 rounded text-center">
                          <div className="font-bold">HP</div>
                          <div>{poke.stats.hp}</div>
                        </div>
                        <div className="bg-gray-50 p-1 rounded text-center">
                          <div className="font-bold">ATK</div>
                          <div>{poke.stats.atk}</div>
                        </div>
                        <div className="bg-gray-50 p-1 rounded text-center">
                          <div className="font-bold">DEF</div>
                          <div>{poke.stats.def}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPokemon.map((poke) => (
                    <div
                      key={poke.id}
                      className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition flex items-center gap-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        <PokemonImage pokemon={poke} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{poke.name}</h3>
                        <div className="flex gap-1 flex-wrap">
                          {poke.types.map((type) => (
                            <TypeSticker key={type} type={type} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PlayerView = () => {
    if (!selectedPlayer) return null;

    const handleDeletePlayer = () => {
      setPlayers(players.filter(p => p.id !== selectedPlayer.id));
      setCurrentView('home');
      setSelectedPlayer(null);
    };

    const handleAddWin = () => {
      const updatedPlayers = players.map(p =>
        p.id === selectedPlayer.id
          ? {
              ...p,
              stats: { ...p.stats, wins: p.stats.wins + 1 }
            }
          : p
      );
      setPlayers(updatedPlayers);
      setSelectedPlayer(updatedPlayers.find(p => p.id === selectedPlayer.id));
    };

    const handleAddLoss = () => {
      const updatedPlayers = players.map(p =>
        p.id === selectedPlayer.id
          ? {
              ...p,
              stats: { ...p.stats, losses: p.stats.losses + 1 }
            }
          : p
      );
      setPlayers(updatedPlayers);
      setSelectedPlayer(updatedPlayers.find(p => p.id === selectedPlayer.id));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-400 to-pink-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              setCurrentView('home');
              setSelectedPlayer(null);
            }}
            className="text-white font-bold mb-6 flex items-center gap-2 hover:opacity-80"
          >
            ← Retour
          </button>

          <div className="bg-white rounded-3xl p-6 shadow-2xl mb-6">
            <h1 className="text-4xl font-black text-center text-gray-800 mb-4">{selectedPlayer.name}</h1>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-green-600 text-sm font-bold">Victoires</p>
                <p className="text-4xl font-black text-green-600">{selectedPlayer.stats.wins}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-red-600 text-sm font-bold">Défaites</p>
                <p className="text-4xl font-black text-red-600">{selectedPlayer.stats.losses}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={handleAddWin}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition"
              >
                ✓ Victoire
              </button>
              <button
                onClick={handleAddLoss}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition"
              >
                ✗ Défaite
              </button>
            </div>

            <button
              onClick={handleDeletePlayer}
              className="w-full bg-gray-200 text-red-600 py-3 rounded-xl font-bold hover:bg-gray-300 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={18} /> Supprimer le joueur
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NewPlayerForm = () => {
    const [name, setName] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
        <div className="w-full bg-white rounded-t-3xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Nouveau joueur</h2>
          <input
            type="text"
            placeholder="Nom du joueur"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-red-500"
            autoComplete="off"
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowNewPlayerForm(false);
                setName('');
              }}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (name.trim()) {
                  const newPlayer = {
                    id: Date.now(),
                    name: name.trim(),
                    pokemon: [],
                    teams: [],
                    battles: [],
                    stats: { wins: 0, losses: 0 },
                  };
                  setPlayers([...players, newPlayer]);
                  setShowNewPlayerForm(false);
                  setName('');
                }
              }}
              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {currentView === 'home' && <HomeView />}
      {currentView === 'player' && <PlayerView />}
      {showNewPlayerForm && <NewPlayerForm />}
    </div>
  );
};

export default PokemonBattleLogger;
