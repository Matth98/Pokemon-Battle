'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Search, Edit2, Save, Loader, Sword, BarChart3 } from 'lucide-react';

const PokemonBattleLogger = () => {
  const [players, setPlayers] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pokemonNames, setPokemonNames] = useState({});

  // States pour le combat
  const [battleMode, setBattleMode] = useState(null); // '1v1' ou '2v2'
  const [battlePlayers, setBattlePlayers] = useState([]); // Les joueurs en combat
  const [selectedTeams, setSelectedTeams] = useState({}); // Les équipes sélectionnées
  const [battleState, setBattleState] = useState(null); // État du combat en cours
  const [battleHistory, setBattleHistory] = useState({}); // Historique par joueur

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

  // Charger les noms français des Pokémon au démarrage
  useEffect(() => {
    const loadPokemonNames = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        
        const namesMap = {};
        
        for (let i = 0; i < data.results.length; i += 50) {
          const batch = data.results.slice(i, i + 50);
          
          await Promise.all(
            batch.map(async (poke, idx) => {
              try {
                const pokeId = i + idx + 1;
                const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
                const speciesData = await speciesRes.json();
                
                const frenchName = speciesData.names.find(n => n.language.name === 'fr')?.name || poke.name;
                namesMap[pokeId] = {
                  name: frenchName,
                  englishName: poke.name,
                };
              } catch (e) {
                namesMap[i + idx + 1] = {
                  name: poke.name.charAt(0).toUpperCase() + poke.name.slice(1),
                  englishName: poke.name,
                };
              }
            })
          );
        }
        
        setPokemonNames(namesMap);
      } catch (error) {
        console.error('Erreur chargement noms:', error);
      }
    };

    loadPokemonNames();
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

  const searchPokemon = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
      const data = await response.json();
      
      const results = [];
      for (let i = 0; i < data.results.length; i++) {
        const poke = data.results[i];
        const pokeId = i + 1;
        
        let frenchName = pokemonNames[pokeId]?.name;
        
        if (!frenchName) {
          try {
            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
            const speciesData = await speciesRes.json();
            frenchName = speciesData.names.find(n => n.language.name === 'fr')?.name || poke.name;
          } catch (e) {
            frenchName = poke.name.charAt(0).toUpperCase() + poke.name.slice(1);
          }
        }
        
        if (
          frenchName.toLowerCase().includes(query.toLowerCase()) ||
          poke.name.toLowerCase().includes(query.toLowerCase())
        ) {
          results.push({
            pokeId,
            name: frenchName,
            englishName: poke.name,
          });
          
          if (results.length >= 50) break;
        }
      }
      
      setSearchResults(results);
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
      stats: { wins: 0, losses: 0 },
      battles: [],
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };
    setPlayers([...players, newPlayer]);
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
    };
    
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? { ...p, pokemon: [...(p.pokemon || []), newPoke] }
        : p
    );
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === playerId));
  };

  const deletePokemonFromPlayer = (playerId, pokemonId) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId 
        ? { ...p, pokemon: (p.pokemon || []).filter(pk => pk.id !== pokemonId) }
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
            pokemon: (p.pokemon || []).map(pk => pk.id === pokemonId ? { ...pk, ...updates } : pk)
          }
        : p
    );
    setPlayers(updatedPlayers);
    setSelectedPlayer(updatedPlayers.find(p => p.id === playerId));
  };

  const startBattle = (mode, playersInBattle) => {
    setBattleMode(mode);
    setBattlePlayers(playersInBattle);
    setSelectedTeams({});
    setCurrentView('selectTeams');
  };

  const confirmTeams = () => {
    const allTeamsSelected = battleMode === '1v1' 
      ? Object.keys(selectedTeams).length === 2 && Object.values(selectedTeams).every(t => t.length === 3)
      : Object.keys(selectedTeams).length === 2 && Object.values(selectedTeams).every(t => t.length === 4);

    if (!allTeamsSelected) {
      alert('Veuillez sélectionner une équipe complète pour chaque joueur');
      return;
    }

    // Initialiser le combat
    const battle = {
      id: Date.now(),
      players: battlePlayers.map(p => ({
        id: p.id,
        name: p.name,
        team: selectedTeams[p.id],
        eliminated: [],
      })),
      winner: null,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    setBattleState(battle);
    setCurrentView('battle');
  };

  const eliminatePokemon = (playerIndex, pokemonId) => {
    const updatedBattle = { ...battleState };
    const pokemon = updatedBattle.players[playerIndex].team.find(p => p.id === pokemonId);
    
    if (pokemon) {
      updatedBattle.players[playerIndex].eliminated.push(pokemonId);
      setBattleState(updatedBattle);

      // Vérifier si un joueur a perdu tous ses Pokémon
      const remainingPokemon = updatedBattle.players[playerIndex].team.filter(
        p => !updatedBattle.players[playerIndex].eliminated.includes(p.id)
      );

      if (remainingPokemon.length === 0) {
        endBattle(1 - playerIndex); // L'autre joueur gagne
      }
    }
  };

  const endBattle = (winnerIndex) => {
    const updatedBattle = { ...battleState };
    updatedBattle.winner = winnerIndex;

    // Mettre à jour les stats des joueurs
    const updatedPlayers = players.map(player => {
      const playerInBattle = updatedBattle.players.findIndex(p => p.id === player.id);
      if (playerInBattle !== -1) {
        const isWinner = playerInBattle === winnerIndex;
        return {
          ...player,
          stats: {
            wins: player.stats.wins + (isWinner ? 1 : 0),
            losses: player.stats.losses + (isWinner ? 0 : 1),
          },
          battles: [...(player.battles || []), {
            id: updatedBattle.id,
            opponent: updatedBattle.players[1 - playerInBattle].name,
            won: isWinner,
            date: updatedBattle.date,
          }],
        };
      }
      return player;
    });

    setPlayers(updatedPlayers);
    setBattleState(updatedBattle);
    setCurrentView('battleResult');
  };

  // HOME VIEW
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 mt-6">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">PokéBattle</h1>
            <p className="text-white text-sm drop-shadow font-bold">Suivi Champions</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('players')}
              className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition text-left font-bold text-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>Mes Profils ({players.length})</div>
              </div>
            </button>

            <button
              onClick={() => setCurrentView('battles')}
              className="w-full bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition text-left font-bold text-gray-800"
            >
              <div className="flex items-center gap-3">
                <Sword size={24} className="text-red-500" />
                <div>Nouveaux Combats</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PLAYERS LIST VIEW
  if (currentView === 'players') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className="text-white font-bold mb-6 flex items-center gap-2"
          >
            ← Retour
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-6">Mes Profils</h1>

          {players.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun joueur</h2>
              <button
                onClick={() => setShowNewPlayerForm(true)}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600"
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
                        {player.stats.wins}V - {player.stats.losses}D | {(player.pokemon || []).length} Pokémon
                      </p>
                    </div>
                    <ChevronRight className="text-red-500" />
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowNewPlayerForm(true)}
                className="w-full bg-white rounded-xl p-4 shadow-md text-center font-bold text-red-500 border-2 border-red-300"
              >
                <Plus size={20} className="inline mr-2" /> Nouveau profil
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
                    document.getElementById('new-player-input').value = '';
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
              setCurrentView('players');
              setSelectedPlayer(null);
            }}
            className="text-white font-bold mb-6 flex items-center gap-2"
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
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex justify-between items-center">
              Pokémon
              <button
                onClick={() => setCurrentView('addPokemon')}
                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
              >
                <Plus size={24} />
              </button>
            </h2>

            {(selectedPlayer.pokemon || []).length === 0 ? (
              <p className="text-gray-600 text-center py-8">Aucun Pokémon</p>
            ) : (
              <div className="space-y-3">
                {selectedPlayer.pokemon.map((poke) => (
                  <div key={poke.id} className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getPokemonImageUrl(poke.pokeId)}
                        alt={poke.name}
                        className="w-16 h-16 object-contain"
                      />
                      <div>
                        <h3 className="font-bold text-gray-800">{poke.name}</h3>
                        <p className="text-sm text-gray-600">Niveau {poke.level}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCurrentView('editPokemon');
                          setSelectedPlayer({...selectedPlayer, editingPokemon: poke});
                        }}
                        className="bg-blue-500 text-white p-2 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deletePokemonFromPlayer(selectedPlayer.id, poke.id)}
                        className="bg-red-500 text-white p-2 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-teal-400 to-blue-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('profile')}
            className="text-white font-bold mb-6 flex items-center gap-2"
          >
            ← Retour
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-6">Ajouter un Pokémon</h1>

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
              className="w-full border-2 border-white rounded-xl px-3 py-2 pl-10 text-sm bg-white text-gray-800"
              autoFocus
            />
          </div>

          {searchLoading ? (
            <div className="text-center text-white">
              <Loader className="animate-spin mx-auto mb-2" />
              <p>Recherche en cours...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-600">Aucun résultat trouvé</div>
          ) : searchTerm ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((poke) => (
                <button
                  key={poke.pokeId}
                  onClick={() => {
                    addPokemonToPlayer(selectedPlayer.id, poke);
                    setCurrentView('profile');
                  }}
                  className="w-full bg-white rounded-xl p-3 shadow-md hover:shadow-lg text-left flex gap-3"
                >
                  <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-12 h-12 object-contain" />
                  <div>
                    <h3 className="font-bold text-gray-800">{poke.name}</h3>
                    <p className="text-xs text-gray-600">#{poke.pokeId}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center text-gray-600">Commence à taper un nom...</div>
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
            className="text-white font-bold mb-6"
          >
            ← Retour
          </button>

          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-24 h-24 mx-auto" />
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
                  min="1" max="100"
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

              <button
                onClick={() => {
                  updatePokemonInPlayer(selectedPlayer.id, poke.id, poke);
                  setCurrentView('profile');
                  setSelectedPlayer({...selectedPlayer, editingPokemon: null});
                }}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 flex justify-center gap-2"
              >
                <Save size={20} /> Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // BATTLES VIEW - Sélectionner joueurs et mode
  if (currentView === 'battles') {
    const [step, setStep] = useState(1); // 1 = mode, 2 = joueurs
    const [selectedPlayersForBattle, setSelectedPlayersForBattle] = useState([]);

    if (step === 1) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setCurrentView('home')}
              className="text-white font-bold mb-6 flex items-center gap-2"
            >
              ← Retour
            </button>

            <h1 className="text-3xl font-black text-white text-center mb-6">Mode de Combat</h1>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setBattleMode('1v1');
                  setStep(2);
                }}
                className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center"
              >
                <div className="text-4xl mb-2">⚔️</div>
                <h2 className="text-2xl font-black text-gray-800">1v1</h2>
                <p className="text-gray-600 text-sm">3 Pokémon par joueur</p>
              </button>

              <button
                onClick={() => {
                  setBattleMode('2v2');
                  setStep(2);
                }}
                className="w-full bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition text-center"
              >
                <div className="text-4xl mb-2">⚔️⚔️</div>
                <h2 className="text-2xl font-black text-gray-800">2v2</h2>
                <p className="text-gray-600 text-sm">4 Pokémon par joueur</p>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-red-500 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setStep(1)}
              className="text-white font-bold mb-6 flex items-center gap-2"
            >
              ← Retour
            </button>

            <h1 className="text-3xl font-black text-white text-center mb-6">
              Sélectionner {battleMode === '1v1' ? '2' : '4'} joueurs
            </h1>

            <div className="space-y-3">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    if (selectedPlayersForBattle.find(p => p.id === player.id)) {
                      setSelectedPlayersForBattle(selectedPlayersForBattle.filter(p => p.id !== player.id));
                    } else {
                      const maxPlayers = battleMode === '1v1' ? 2 : 4;
                      if (selectedPlayersForBattle.length < maxPlayers) {
                        setSelectedPlayersForBattle([...selectedPlayersForBattle, player]);
                      }
                    }
                  }}
                  className={`w-full rounded-xl p-4 shadow-md hover:shadow-lg transition text-left font-bold ${
                    selectedPlayersForBattle.find(p => p.id === player.id)
                      ? 'bg-green-400 text-white'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg">{player.name}</h3>
                      <p className="text-sm">{(player.pokemon || []).length} Pokémon</p>
                    </div>
                    {selectedPlayersForBattle.find(p => p.id === player.id) && (
                      <div className="text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                const maxPlayers = battleMode === '1v1' ? 2 : 4;
                if (selectedPlayersForBattle.length === maxPlayers) {
                  startBattle(battleMode, selectedPlayersForBattle);
                } else {
                  alert(`Veuillez sélectionner ${maxPlayers} joueurs`);
                }
              }}
              disabled={battleMode === '1v1' ? selectedPlayersForBattle.length !== 2 : selectedPlayersForBattle.length !== 4}
              className="w-full mt-6 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 disabled:bg-gray-400"
            >
              Commencer le Combat
            </button>
          </div>
        </div>
      );
    }
  }

  // SELECT TEAMS VIEW
  if (currentView === 'selectTeams') {
    const pokemonCount = battleMode === '1v1' ? 3 : 4;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-400 to-red-500 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              setCurrentView('battles');
              setBattleMode(null);
              setBattlePlayers([]);
            }}
            className="text-white font-bold mb-6 flex items-center gap-2"
          >
            ← Retour
          </button>

          <h1 className="text-3xl font-black text-white text-center mb-6">Sélectionner les Équipes</h1>

          <div className="space-y-6">
            {battlePlayers.map((player) => (
              <div key={player.id} className="bg-white rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-black text-gray-800 mb-4">{player.name}</h2>
                <p className="text-sm text-gray-600 mb-4">Choisis {pokemonCount} Pokémon</p>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {(player.pokemon || []).map((poke) => (
                    <button
                      key={poke.id}
                      onClick={() => {
                        const current = selectedTeams[player.id] || [];
                        if (current.find(p => p.id === poke.id)) {
                          setSelectedTeams({
                            ...selectedTeams,
                            [player.id]: current.filter(p => p.id !== poke.id),
                          });
                        } else {
                          if (current.length < pokemonCount) {
                            setSelectedTeams({
                              ...selectedTeams,
                              [player.id]: [...current, poke],
                            });
                          }
                        }
                      }}
                      className={`w-full rounded-xl p-3 flex items-center gap-3 text-left ${
                        (selectedTeams[player.id] || []).find(p => p.id === poke.id)
                          ? 'bg-green-400 text-white font-bold'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <img
                        src={getPokemonImageUrl(poke.pokeId)}
                        alt={poke.name}
                        className="w-10 h-10 object-contain"
                      />
                      <div>
                        <h3 className="font-bold">{poke.name}</h3>
                        <p className="text-xs">Niv. {poke.level}</p>
                      </div>
                      {(selectedTeams[player.id] || []).find(p => p.id === poke.id) && (
                        <div className="ml-auto text-lg">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-gray-600">
                  Sélectionnés: {(selectedTeams[player.id] || []).length}/{pokemonCount}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={confirmTeams}
            className="w-full mt-6 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600"
          >
            Commencer le Combat
          </button>
        </div>
      </div>
    );
  }

  // BATTLE VIEW
  if (currentView === 'battle' && battleState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-black text-white text-center mb-6">Combat en cours</h1>

          <div className="grid grid-cols-2 gap-4">
            {battleState.players.map((player, idx) => {
              const remaining = player.team.filter(p => !player.eliminated.includes(p.id));
              return (
                <div key={player.id} className="bg-white rounded-2xl p-4 shadow-2xl">
                  <h2 className="font-black text-gray-800 mb-4">{player.name}</h2>
                  <div className="space-y-2">
                    {player.team.map((poke) => (
                      <button
                        key={poke.id}
                        onClick={() => {
                          if (!player.eliminated.includes(poke.id)) {
                            eliminatePokemon(idx, poke.id);
                          }
                        }}
                        disabled={player.eliminated.includes(poke.id)}
                        className={`w-full rounded-lg p-2 text-sm font-bold transition ${
                          player.eliminated.includes(poke.id)
                            ? 'bg-gray-300 text-gray-600 line-through'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {poke.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-4 font-bold">
                    Restants: {remaining.length}/{player.team.length}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // BATTLE RESULT VIEW
  if (currentView === 'battleResult' && battleState && battleState.winner !== null) {
    const winner = battleState.players[battleState.winner];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-400 to-teal-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-black text-gray-800 mb-2">{winner.name}</h1>
            <p className="text-gray-600 mb-6">Remporte la victoire!</p>

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <h2 className="font-black text-gray-800 mb-4">Résumé du Combat</h2>
              {battleState.players.map((player, idx) => {
                const eliminated = player.eliminated.length;
                const total = player.team.length;
                return (
                  <div key={player.id} className="mb-3">
                    <p className="font-bold text-gray-800">{player.name}</p>
                    <p className="text-sm text-gray-600">{total - eliminated} Pokémon restants | {eliminated} éliminés</p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setCurrentView('home');
                setBattleState(null);
                setBattleMode(null);
                setBattlePlayers([]);
                setSelectedTeams({});
              }}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600"
            >
              Retour à l'Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PokemonBattleLogger;
