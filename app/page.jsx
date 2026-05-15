'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Search, Edit2, Save, Loader } from 'lucide-react';

const FRENCH_NAMES_MAP = {
  'bulbasaur': 'Bulbizarre', 'ivysaur': 'Herbizarre', 'venusaur': 'Florizarre',
  'charmander': 'Salamèche', 'charmeleon': 'Reptincel', 'charizard': 'Dracaufeu',
  'squirtle': 'Carapuce', 'wartortle': 'Carabaffe', 'blastoise': 'Tortank',
  'caterpie': 'Chenipan', 'metapod': 'Chrysacier', 'butterfree': 'Papilusion',
  'weedle': 'Aspicot', 'kakuna': 'Coconfort', 'beedrill': 'Dardargnan',
  'pidgeot': 'Pidgeot', 'pikachu': 'Pikachu', 'raichu': 'Raichu',
  'arcanine': 'Arcanin', 'lapras': 'Lokhlass', 'gengar': 'Ectoplasma',
  'dragonite': 'Dracolosse', 'alakazam': 'Alakazam', 'machamp': 'Machamp',
  'golem': 'Golem', 'weavile': 'Momolice', 'garchomp': 'Garchomp',
  'blaziken': 'Flambusard', 'rotom-wash': 'Rotom-Lavage', 'heatran': 'Heatran',
  'incineroar': 'Incinéroar', 'corviknight': 'Corvailleur', 'grimmsnarl': 'Babimanta',
};

const PokemonBattleLogger = () => {
  const [players, setPlayers] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Charger les données du localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pokebattle_players');
    if (saved) {
      try {
        setPlayers(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur:', e);
      }
    }
  }, []);

  // Sauvegarder les données
  useEffect(() => {
    if (players.length > 0) {
      localStorage.setItem('pokebattle_players', JSON.stringify(players));
    }
  }, [players]);

  const getPokemonImageUrl = (id) => {
    return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  // Rechercher les Pokémon
  const searchPokemon = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Récupérer tous les Pokémon une fois
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
      const data = await response.json();
      
      // Filtrer par nom
      const filtered = data.results
        .filter(poke => poke.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 50)
        .map((poke, idx) => ({
          name: FRENCH_NAMES_MAP[poke.name] || poke.name.charAt(0).toUpperCase() + poke.name.slice(1),
          pokeId: data.results.indexOf(poke) + 1,
          apiUrl: poke.url,
        }));

      setSearchResults(filtered);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const addPlayer = (name) => {
    const newPlayer = {
      id: Date.now(),
      name,
      pokemon: [],
      stats: { wins: 0, losses: 0, totalBattles: 0 },
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    setPlayers([...players, newPlayer]);
  };

  const updatePlayer = (playerId, updates) => {
    setPlayers(players.map(p => p.id === playerId ? {...p, ...updates} : p));
    if (selectedPlayer?.id === playerId) {
      setSelectedPlayer({...selectedPlayer, ...updates});
    }
  };

  const addPokemonToPlayer = (playerId, pokemon) => {
    const newPoke = {
      id: Date.now(),
      pokeId: pokemon.pokeId,
      name: pokemon.name,
      level: 50,
      hp: 100,
      atk: 100,
      def: 100,
      spa: 100,
      spd: 100,
      spe: 100,
      item: 'Aucun',
      moves: ['Éclair', 'Tonnerre', 'Charge', 'Morsure'],
    };
    
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? {...p, pokemon: [...(p.pokemon || []), newPoke]}
        : p
    );
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === playerId));
  };

  const deletePokemonFromPlayer = (playerId, pokemonId) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? {...p, pokemon: (p.pokemon || []).filter(pk => pk.id !== pokemonId)}
        : p
    );
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === playerId));
  };

  const updatePokemonInPlayer = (playerId, pokemonId, updates) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? {
            ...p, 
            pokemon: (p.pokemon || []).map(pk => pk.id === pokemonId ? {...pk, ...updates} : pk)
          }
        : p
    );
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === playerId));
  };

  // HOME VIEW
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 mt-6">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">PokéBattle</h1>
            <p className="text-white text-sm drop-shadow font-bold">Suivi Champions Pokémon</p>
          </div>

          {players.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun joueur</h2>
              <p className="text-gray-600 mb-6">Créez votre premier profil!</p>
              <button
                onClick={() => setShowNewPlayerForm(true)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition"
              >
                Créer un profil
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setCurrentView('profile');
                  }}
                  className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{player.name}</h3>
                      <p className="text-sm text-gray-500">
                        <span className="text-green-600 font-bold">{player.stats.wins}V</span>
                        {' - '}
                        <span className="text-red-600 font-bold">{player.stats.losses}D</span>
                        {' | '}
                        {(player.pokemon || []).length} Pokémon
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
                <Plus size={20} /> Nouveau profil
              </button>
            </div>
          )}
        </div>

        {showNewPlayerForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-3xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Nouveau profil</h2>
              <input
                type="text"
                placeholder="Nom du joueur"
                id="new-player-input"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-red-500"
                autoComplete="off"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewPlayerForm(false);
                    const input = document.getElementById('new-player-input');
                    if (input) input.value = '';
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('new-player-input');
                    const name = input.value.trim();
                    if (name) {
                      addPlayer(name);
                      setShowNewPlayerForm(false);
                      input.value = '';
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PROFILE VIEW
  if (currentView === 'profile' && selectedPlayer) {
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

            <p className="text-center text-gray-600 mb-6">
              Pokémon: <span className="font-bold">{(selectedPlayer.pokemon || []).length}</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              Pokémon
              <button
                onClick={() => setCurrentView('addPokemon')}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
              >
                <Plus size={24} />
              </button>
            </h2>

            {(selectedPlayer.pokemon || []).length === 0 ? (
              <p className="text-gray-600 text-center py-8">Aucun Pokémon. Ajoutes-en un!</p>
            ) : (
              <div className="space-y-3">
                {selectedPlayer.pokemon.map((poke) => (
                  <div
                    key={poke.id}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={getPokemonImageUrl(poke.pokeId)}
                        alt={poke.name}
                        className="w-16 h-16 object-contain"
                        onError={(e) => { e.target.src = ''; }}
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">{poke.name}</h3>
                        <p className="text-sm text-gray-600">Niveau {poke.level}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentView('editPokemon');
                        setSelectedPlayer({...selectedPlayer, editingPokemon: poke});
                      }}
                      className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition mr-2"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deletePokemonFromPlayer(selectedPlayer.id, poke.id)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADD POKEMON VIEW
  if (currentView === 'addPokemon') {
    const [searchTerm, setSearchTerm] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-teal-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('profile')}
            className="text-white font-bold mb-6 flex items-center gap-2 hover:opacity-80"
          >
            ← Retour
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-6 drop-shadow-lg">
            Ajouter un Pokémon
          </h1>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Chercher un Pokémon..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchPokemon(e.target.value);
              }}
              className="w-full border-2 border-white rounded-xl px-3 py-2 pl-10 focus:outline-none text-sm bg-white text-gray-800"
              autoComplete="off"
              autoFocus
            />
          </div>

          {searchLoading ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <Loader className="animate-spin mx-auto mb-2" size={24} />
              <p className="text-gray-600">Recherche en cours...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-600">Aucun Pokémon trouvé</p>
            </div>
          ) : searchTerm ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((poke) => (
                <button
                  key={poke.pokeId}
                  onClick={() => {
                    addPokemonToPlayer(selectedPlayer.id, poke);
                    setCurrentView('profile');
                  }}
                  className="w-full bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition flex items-center gap-3 text-left"
                >
                  <img
                    src={getPokemonImageUrl(poke.pokeId)}
                    alt={poke.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => { e.target.src = ''; }}
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{poke.name}</h3>
                    <p className="text-xs text-gray-600">#ID {poke.pokeId}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center">
              <p className="text-gray-600">Commence à taper un nom...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // EDIT POKEMON VIEW
  if (currentView === 'editPokemon' && selectedPlayer?.editingPokemon) {
    const poke = selectedPlayer.editingPokemon;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-red-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              setCurrentView('profile');
              setSelectedPlayer({...selectedPlayer, editingPokemon: null});
            }}
            className="text-white font-bold mb-6 flex items-center gap-2 hover:opacity-80"
          >
            ← Retour
          </button>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <img
                src={getPokemonImageUrl(poke.pokeId)}
                alt={poke.name}
                className="w-24 h-24 object-contain mx-auto"
                onError={(e) => { e.target.src = ''; }}
              />
              <h1 className="text-3xl font-black text-gray-800 mt-4">{poke.name}</h1>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-700 font-bold">Niveau</label>
                <input
                  type="number"
                  value={poke.level}
                  onChange={(e) => {
                    const updated = {...poke, level: parseInt(e.target.value) || 1};
                    setSelectedPlayer({...selectedPlayer, editingPokemon: updated});
                  }}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-2"
                  min="1"
                  max="100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((stat) => (
                  <div key={stat}>
                    <label className="text-gray-700 font-bold text-sm">{stat.toUpperCase()}</label>
                    <input
                      type="number"
                      value={poke[stat]}
                      onChange={(e) => {
                        const updated = {...poke, [stat]: parseInt(e.target.value) || 0};
                        setSelectedPlayer({...selectedPlayer, editingPokemon: updated});
                      }}
                      className="w-full border-2 border-gray-300 rounded-xl px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-gray-700 font-bold">Objet</label>
                <input
                  type="text"
                  value={poke.item}
                  onChange={(e) => {
                    const updated = {...poke, item: e.target.value};
                    setSelectedPlayer({...selectedPlayer, editingPokemon: updated});
                  }}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-2"
                  placeholder="Ex: Scarpa de Fermeté"
                />
              </div>

              <button
                onClick={() => {
                  updatePokemonInPlayer(selectedPlayer.id, poke.id, poke);
                  setCurrentView('profile');
                  setSelectedPlayer({...selectedPlayer, editingPokemon: null});
                }}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <Save size={20} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PokemonBattleLogger;
