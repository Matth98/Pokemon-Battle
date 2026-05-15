'use client';

import React, { useState, useEffect } from 'react';
import { Home, Users, Plus, Zap, Shield, Search, ChevronRight, Trash2, Edit2, Save, Loader } from 'lucide-react';

const PokemonBattleLogger = () => {
  const [players, setPlayers] = useState([]);
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pokemonNames, setPokemonNames] = useState({});
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [showNewBattleForm, setShowNewBattleForm] = useState(false);
  const [newBattle, setNewBattle] = useState({
    format: '1v1',
    player1: null,
    player2: null,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    winner: null,
  });

  // Charger les données du localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pokebattle_players');
    const savedTeams = localStorage.getItem('pokebattle_teams');
    const savedBattles = localStorage.getItem('pokebattle_battles');
    
    if (saved) {
      try {
        setPlayers(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur:', e);
      }
    }
    
    if (savedTeams) {
      try {
        setTeams(JSON.parse(savedTeams));
      } catch (e) {
        console.error('Erreur teams:', e);
      }
    }

    if (savedBattles) {
      try {
        setBattles(JSON.parse(savedBattles));
      } catch (e) {
        console.error('Erreur battles:', e);
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
        
        for (let i = 0; i < Math.min(data.results.length, 200); i += 50) {
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
                  name: (data.results[i + idx]?.name || 'Pokémon').charAt(0).toUpperCase() + (data.results[i + idx]?.name || '').slice(1),
                  englishName: data.results[i + idx]?.name || '',
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
    if (teams.length > 0) {
      localStorage.setItem('pokebattle_teams', JSON.stringify(teams));
    }
    if (battles.length > 0) {
      localStorage.setItem('pokebattle_battles', JSON.stringify(battles));
    }
  }, [players, teams, battles]);

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

  const recordBattle = () => {
    if (!newBattle.player1 || !newBattle.player2 || !newBattle.winner) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const battle = {
      id: Date.now(),
      ...newBattle,
      player1Name: newBattle.player1,
      player2Name: newBattle.player2,
    };

    setBattles([...battles, battle]);

    // Mettre à jour les stats des joueurs
    const updatedPlayers = players.map(p => {
      if (p.id === newBattle.player1 || p.id === newBattle.player2) {
        const isWinner = (newBattle.winner === 'player1' && p.id === newBattle.player1) || 
                         (newBattle.winner === 'player2' && p.id === newBattle.player2);
        return {
          ...p,
          stats: {
            wins: p.stats.wins + (isWinner ? 1 : 0),
            losses: p.stats.losses + (isWinner ? 0 : 1),
          },
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);

    // Réinitialiser le formulaire
    setNewBattle({
      format: '1v1',
      player1: null,
      player2: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      winner: null,
    });
    setShowNewBattleForm(false);
  };

  // HOME TAB
  const renderHome = () => (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 pt-8 pb-12 px-4">
        <h1 className="text-4xl font-black text-white mb-2">Pokémon</h1>
        <p className="text-yellow-400 text-3xl font-black mb-4">Battle Tracker</p>
        <p className="text-gray-400">Enregistrez vos combats, analysez vos équipes</p>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-gray-400 text-sm">JOUEURS</p>
            <p className="text-2xl font-black text-white">{players.length}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-2">⚔️</div>
            <p className="text-gray-400 text-sm">COMBATS</p>
            <p className="text-2xl font-black text-white">{battles.length}</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-2">🛡️</div>
            <p className="text-gray-400 text-sm">ÉQUIPES</p>
            <p className="text-2xl font-black text-white">{teams.length}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-8 space-y-4">
        <button
          onClick={() => setShowNewBattleForm(true)}
          className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition"
        >
          + Combat
        </button>
        <button
          onClick={() => setCurrentTab('players')}
          className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-700 transition"
        >
          👥 Ajouter joueur
        </button>
      </div>

      {/* Recent Battles */}
      <div className="px-4 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            📊 Combats récents
          </h2>
          {battles.length > 0 && (
            <a href="#" onClick={() => setCurrentTab('battles')} className="text-yellow-400 font-bold">
              Voir tout →
            </a>
          )}
        </div>

        {battles.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Aucun combat enregistré</p>
          </div>
        ) : (
          <div className="space-y-4">
            {battles.slice(-2).map((battle) => (
              <div key={battle.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <p className="text-yellow-400 text-sm font-bold mb-2">{battle.format}</p>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`font-bold ${battle.winner === 'player1' ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {battle.player1Name}
                    </p>
                  </div>
                  <p className="text-gray-400 mx-4">vs</p>
                  <div className="flex-1 text-right">
                    <p className={`font-bold ${battle.winner === 'player2' ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {battle.player2Name}
                    </p>
                  </div>
                </div>
                {battle.winner && (
                  <p className="text-yellow-400 text-sm text-center mt-2 font-bold">
                    🏆 {battle.winner === 'player1' ? battle.player1Name : battle.player2Name} a gagné
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // PLAYERS TAB
  const renderPlayers = () => (
    <div className="pb-24">
      <div className="bg-gray-900 pt-8 pb-6 px-4 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl font-black text-white">Joueurs</h1>
          <p className="text-gray-400 text-sm">{players.length} joueurs</p>
        </div>
        <button
          onClick={() => setShowNewPlayerForm(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-full font-black hover:bg-yellow-500"
        >
          + Ajouter
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {players.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Aucun joueur créé</p>
          </div>
        ) : (
          players.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                setSelectedPlayer(player);
                setCurrentTab('playerDetail');
              }}
              className="w-full bg-gray-800 rounded-2xl p-4 border border-gray-700 hover:border-gray-600 transition text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-lg">{player.name}</h3>
                  <p className="text-gray-400 text-sm">
                    ⚔️ {player.stats.wins} combats · 🏆 {player.stats.wins} victoires
                  </p>
                </div>
                <ChevronRight className="text-gray-400" />
              </div>
            </button>
          ))
        )}
      </div>

      {showNewPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
          <div className="w-full bg-gray-800 rounded-t-3xl p-6 border-t border-gray-700">
            <h2 className="text-2xl font-black text-white mb-4">Nouveau joueur</h2>
            <input
              type="text"
              placeholder="Nom du joueur"
              id="new-player-input"
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-600"
              autoComplete="off"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewPlayerForm(false);
                  document.getElementById('new-player-input').value = '';
                }}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold"
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
                className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-black hover:bg-yellow-500"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // PLAYER DETAIL TAB
  const renderPlayerDetail = () => (
    selectedPlayer && (
      <div className="pb-24">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 pt-6 pb-8 px-4 flex justify-between items-start sticky top-0">
          <button
            onClick={() => {
              setCurrentTab('players');
              setSelectedPlayer(null);
            }}
            className="text-gray-400 hover:text-white"
          >
            ←
          </button>
          <h1 className="text-2xl font-black text-white">{selectedPlayer.name}</h1>
          <div />
        </div>

        <div className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-900 rounded-2xl p-4 border border-green-700 text-center">
              <p className="text-green-400 text-sm font-bold">VICTOIRES</p>
              <p className="text-3xl font-black text-white">{selectedPlayer.stats.wins}</p>
            </div>
            <div className="bg-red-900 rounded-2xl p-4 border border-red-700 text-center">
              <p className="text-red-400 text-sm font-bold">DÉFAITES</p>
              <p className="text-3xl font-black text-white">{selectedPlayer.stats.losses}</p>
            </div>
          </div>

          <h2 className="text-xl font-black text-white mb-4 flex justify-between items-center">
            Pokémon
            <button
              onClick={() => setCurrentTab('addPokemon')}
              className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold text-sm"
            >
              + Ajouter
            </button>
          </h2>

          {(selectedPlayer.pokemon || []).length === 0 ? (
            <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
              <p className="text-gray-400">Aucun Pokémon</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlayer.pokemon.map((poke) => (
                <div key={poke.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={getPokemonImageUrl(poke.pokeId)}
                      alt={poke.name}
                      className="w-12 h-12 object-contain"
                    />
                    <div>
                      <h3 className="font-bold text-white">{poke.name}</h3>
                      <p className="text-gray-400 text-sm">Niveau {poke.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentTab('editPokemon');
                        setSelectedPlayer({...selectedPlayer, editingPokemon: poke});
                      }}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletePokemonFromPlayer(selectedPlayer.id, poke.id)}
                      className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  );

  // ADD POKEMON TAB
  const renderAddPokemon = () => (
    <div className="pb-24">
      <div className="bg-gray-900 pt-6 pb-6 px-4 flex justify-between items-start sticky top-0">
        <button
          onClick={() => setCurrentTab('playerDetail')}
          className="text-gray-400 hover:text-white"
        >
          ←
        </button>
        <h1 className="text-2xl font-black text-white">Ajouter un Pokémon</h1>
        <div />
      </div>

      <div className="px-4 mt-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Chercher un Pokémon..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchPokemon(e.target.value);
            }}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-700"
            autoFocus
          />
        </div>

        {searchLoading ? (
          <div className="text-center text-gray-400">
            <Loader className="animate-spin mx-auto mb-2" />
            <p>Recherche en cours...</p>
          </div>
        ) : searchTerm && searchResults.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Aucun résultat trouvé</p>
          </div>
        ) : searchTerm ? (
          <div className="space-y-2">
            {searchResults.map((poke) => (
              <button
                key={poke.pokeId}
                onClick={() => {
                  addPokemonToPlayer(selectedPlayer.id, poke);
                  setCurrentTab('playerDetail');
                  setSearchTerm('');
                }}
                className="w-full bg-gray-800 rounded-xl p-3 hover:bg-gray-700 transition flex items-center gap-3 border border-gray-700"
              >
                <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-10 h-10 object-contain" />
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-white">{poke.name}</h3>
                  <p className="text-xs text-gray-400">#{poke.pokeId}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Commence à taper un nom...</p>
          </div>
        )}
      </div>
    </div>
  );

  // EDIT POKEMON TAB
  const renderEditPokemon = () => (
    selectedPlayer?.editingPokemon && (
      <div className="pb-24">
        <div className="bg-gray-900 pt-6 pb-6 px-4 flex justify-between items-start sticky top-0">
          <button
            onClick={() => {
              setCurrentTab('playerDetail');
              setSelectedPlayer({...selectedPlayer, editingPokemon: null});
            }}
            className="text-gray-400 hover:text-white"
          >
            ←
          </button>
          <h1 className="text-2xl font-black text-white">Modifier Pokémon</h1>
          <div />
        </div>

        <div className="px-4 mt-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="text-center mb-6">
              <img src={getPokemonImageUrl(selectedPlayer.editingPokemon.pokeId)} alt={selectedPlayer.editingPokemon.name} className="w-20 h-20 mx-auto" />
              <h1 className="text-2xl font-black text-white mt-4">{selectedPlayer.editingPokemon.name}</h1>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 font-bold text-sm">Niveau</label>
                <input
                  type="number"
                  value={selectedPlayer.editingPokemon.level}
                  onChange={(e) => {
                    const poke = selectedPlayer.editingPokemon;
                    setSelectedPlayer({...selectedPlayer, editingPokemon: {...poke, level: parseInt(e.target.value) || 1}});
                  }}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  min="1" max="100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['hp', 'atk', 'def', 'spa', 'spd', 'spe'].map((stat) => (
                  <div key={stat}>
                    <label className="text-gray-400 font-bold text-sm">{stat.toUpperCase()}</label>
                    <input
                      type="number"
                      value={selectedPlayer.editingPokemon[stat]}
                      onChange={(e) => {
                        const poke = selectedPlayer.editingPokemon;
                        setSelectedPlayer({...selectedPlayer, editingPokemon: {...poke, [stat]: parseInt(e.target.value) || 0}});
                      }}
                      className="w-full bg-gray-700 text-white rounded-lg px-2 py-1 mt-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  updatePokemonInPlayer(selectedPlayer.id, selectedPlayer.editingPokemon.id, selectedPlayer.editingPokemon);
                  setCurrentTab('playerDetail');
                  setSelectedPlayer({...selectedPlayer, editingPokemon: null});
                }}
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-black hover:bg-yellow-500 mt-6"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // BATTLES TAB
  const renderBattles = () => (
    <div className="pb-24">
      <div className="bg-gray-900 pt-8 pb-6 px-4 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl font-black text-white">Combats</h1>
          <p className="text-gray-400 text-sm">{battles.length} combats</p>
        </div>
        <button
          onClick={() => setShowNewBattleForm(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-full font-black hover:bg-yellow-500"
        >
          + Nouveau
        </button>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {battles.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Aucun combat enregistré</p>
          </div>
        ) : (
          battles.map((battle) => (
            <div key={battle.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-yellow-400 text-sm font-bold">{battle.format}</p>
                <p className="text-gray-400 text-sm">{battle.date}</p>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className={`font-bold ${battle.winner === 'player1' ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {battle.player1Name}
                  </p>
                </div>
                <p className="text-gray-400 mx-4">vs</p>
                <div className="flex-1 text-right">
                  <p className={`font-bold ${battle.winner === 'player2' ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {battle.player2Name}
                  </p>
                </div>
              </div>
              {battle.winner && (
                <p className="text-yellow-400 text-sm text-center font-bold">
                  🏆 {battle.winner === 'player1' ? battle.player1Name : battle.player2Name} a gagné
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {showNewBattleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-end z-50">
          <div className="w-full bg-gray-800 rounded-t-3xl p-6 border-t border-gray-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-white mb-4">Nouveau combat</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 font-bold text-sm">FORMAT</label>
                <select
                  value={newBattle.format}
                  onChange={(e) => setNewBattle({...newBattle, format: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="1v1">1v1 (3 Pokémon)</option>
                  <option value="2v2">2v2 (4 Pokémon)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-bold text-sm">DATE</label>
                <input
                  type="date"
                  value={newBattle.date}
                  onChange={(e) => setNewBattle({...newBattle, date: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="text-yellow-400 font-bold text-sm">JOUEUR 1</label>
                <select
                  value={newBattle.player1 || ''}
                  onChange={(e) => setNewBattle({...newBattle, player1: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Choisir joueur</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-red-400 font-bold text-sm">JOUEUR 2</label>
                <select
                  value={newBattle.player2 || ''}
                  onChange={(e) => setNewBattle({...newBattle, player2: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Choisir joueur</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-bold text-sm">GAGNANT</label>
                <select
                  value={newBattle.winner || ''}
                  onChange={(e) => setNewBattle({...newBattle, winner: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Choisir le gagnant</option>
                  <option value="player1">{newBattle.player1 ? players.find(p => p.id === newBattle.player1)?.name : 'Joueur 1'}</option>
                  <option value="player2">{newBattle.player2 ? players.find(p => p.id === newBattle.player2)?.name : 'Joueur 2'}</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-bold text-sm">NOTES</label>
                <textarea
                  value={newBattle.notes}
                  onChange={(e) => setNewBattle({...newBattle, notes: e.target.value})}
                  placeholder="Notes sur le combat..."
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 mt-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewBattleForm(false);
                    setNewBattle({
                      format: '1v1',
                      player1: null,
                      player2: null,
                      date: new Date().toISOString().split('T')[0],
                      notes: '',
                      winner: null,
                    });
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold"
                >
                  Annuler
                </button>
                <button
                  onClick={recordBattle}
                  className="flex-1 bg-yellow-400 text-black py-3 rounded-lg font-black hover:bg-yellow-500"
                >
                  Enregistrer le combat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // TEAMS TAB
  const renderTeams = () => (
    <div className="pb-24">
      <div className="bg-gray-900 pt-8 pb-6 px-4 flex justify-between items-center sticky top-0">
        <div>
          <h1 className="text-2xl font-black text-white">Équipes</h1>
          <p className="text-gray-400 text-sm">{teams.length} équipes</p>
        </div>
        <button
          className="bg-yellow-400 text-black px-4 py-2 rounded-full font-black hover:bg-yellow-500"
        >
          + Créer
        </button>
      </div>

      <div className="px-4 mt-6">
        {teams.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400">Aucune équipe créée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                <h3 className="font-black text-white">{team.name}</h3>
                <p className="text-gray-400 text-sm">{team.owner} · {team.pokemon.length} Pokémon</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Content */}
      {currentTab === 'home' && renderHome()}
      {currentTab === 'players' && renderPlayers()}
      {currentTab === 'playerDetail' && renderPlayerDetail()}
      {currentTab === 'addPokemon' && renderAddPokemon()}
      {currentTab === 'editPokemon' && renderEditPokemon()}
      {currentTab === 'battles' && renderBattles()}
      {currentTab === 'teams' && renderTeams()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around items-center px-4 py-3 z-40">
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'home' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-bold">Accueil</span>
        </button>

        <button
          onClick={() => setCurrentTab('players')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'players' || currentTab === 'playerDetail' || currentTab === 'addPokemon' || currentTab === 'editPokemon'
              ? 'text-yellow-400 border border-yellow-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users size={24} />
          <span className="text-xs font-bold">Joueurs</span>
        </button>

        <button
          onClick={() => setShowNewBattleForm(true)}
          className="flex flex-col items-center gap-1 py-2 px-4 rounded-2xl bg-yellow-400 text-black font-bold -mt-6"
        >
          <Plus size={28} />
          <span className="text-xs">Combat</span>
        </button>

        <button
          onClick={() => setCurrentTab('battles')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'battles' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Zap size={24} />
          <span className="text-xs font-bold">Combats</span>
        </button>

        <button
          onClick={() => setCurrentTab('teams')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'teams' ? 'text-yellow-400 border border-yellow-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield size={24} />
          <span className="text-xs font-bold">Équipes</span>
        </button>
      </div>
    </div>
  );
};

export default PokemonBattleLogger;
