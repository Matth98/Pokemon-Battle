'use client';

import React, { useState, useEffect } from 'react';
import { Home, Users, Plus, Zap, Shield, Search, ChevronRight, Trash2, Edit2, Save, Loader, ArrowLeft, Settings, Moon, Sun } from 'lucide-react';

const POKEMON_TYPES = {
  normal: { name: 'Normal', color: '#A8A878', bg: '#F5F5DC' },
  fire: { name: 'Feu', color: '#F08030', bg: '#FFE5CC' },
  water: { name: 'Eau', color: '#6890F0', bg: '#CCE5FF' },
  electric: { name: 'Électrique', color: '#F8D030', bg: '#FFFACD' },
  grass: { name: 'Plante', color: '#78C850', bg: '#E8F5E9' },
  ice: { name: 'Glace', color: '#98D8D8', bg: '#E0F7FA' },
  fighting: { name: 'Combat', color: '#C03028', bg: '#FFEBEE' },
  poison: { name: 'Poison', color: '#A040A0', bg: '#F3E5F5' },
  ground: { name: 'Sol', color: '#E0C068', bg: '#FFF9E6' },
  flying: { name: 'Vol', color: '#A890F0', bg: '#F3E5F5' },
  psychic: { name: 'Psy', color: '#F85888', bg: '#FCE4EC' },
  bug: { name: 'Insecte', color: '#A8B820', bg: '#F1F8E9' },
  rock: { name: 'Roche', color: '#B8A038', bg: '#FFF3E0' },
  ghost: { name: 'Spectre', color: '#705898', bg: '#EDE7F6' },
  dragon: { name: 'Dragon', color: '#7038F8', bg: '#F3E5F5' },
  dark: { name: 'Ténèbres', color: '#705848', bg: '#EFEBE9' },
  steel: { name: 'Acier', color: '#B8B8D0', bg: '#ECEFF1' },
  fairy: { name: 'Fée', color: '#EE99AC', bg: '#FFC0CB' },
};

const PokemonBattleLogger = () => {
  const [isDark, setIsDark] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [showNewBattleForm, setShowNewBattleForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [pokemonNames, setPokemonNames] = useState({});
  const [newBattleData, setNewBattleData] = useState({
    format: '1v1',
    player1: null,
    player2: null,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    winner: null,
  });
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    owner: null,
    pokemon: [],
  });

  // Charger le thème du localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('pokebattle_theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  // Sauvegarder le thème
  useEffect(() => {
    localStorage.setItem('pokebattle_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Charger les données du localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pokebattle_players');
    const savedTeams = localStorage.getItem('pokebattle_teams');
    const savedBattles = localStorage.getItem('pokebattle_battles');
    
    if (saved) setPlayers(JSON.parse(saved));
    if (savedTeams) setTeams(JSON.parse(savedTeams));
    if (savedBattles) setBattles(JSON.parse(savedBattles));
  }, []);

  // Charger les noms français des Pokémon
  useEffect(() => {
    const loadPokemonNames = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await response.json();
        
        const namesMap = {};
        for (let i = 0; i < Math.min(data.results.length, 300); i += 50) {
          const batch = data.results.slice(i, i + 50);
          
          await Promise.all(
            batch.map(async (poke, idx) => {
              try {
                const pokeId = i + idx + 1;
                const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
                const speciesData = await speciesRes.json();
                
                const frenchName = speciesData.names.find(n => n.language.name === 'fr')?.name || poke.name;
                const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
                const pokeData = await pokeRes.json();
                
                namesMap[pokeId] = {
                  name: frenchName,
                  types: pokeData.types.map(t => t.type.name),
                };
              } catch (e) {
                namesMap[i + idx + 1] = { name: data.results[i + idx]?.name || 'Pokémon', types: ['normal'] };
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
    if (players.length > 0) localStorage.setItem('pokebattle_players', JSON.stringify(players));
    if (teams.length > 0) localStorage.setItem('pokebattle_teams', JSON.stringify(teams));
    if (battles.length > 0) localStorage.setItem('pokebattle_battles', JSON.stringify(battles));
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
        let types = pokemonNames[pokeId]?.types || ['normal'];
        
        if (!frenchName) {
          try {
            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
            const speciesData = await speciesRes.json();
            frenchName = speciesData.names.find(n => n.language.name === 'fr')?.name || poke.name;
          } catch (e) {
            frenchName = poke.name.charAt(0).toUpperCase() + poke.name.slice(1);
          }
        }
        
        if (frenchName.toLowerCase().includes(query.toLowerCase()) || poke.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({ pokeId, name: frenchName, types });
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
    };
    setPlayers([...players, newPlayer]);
  };

  const addPokemonToPlayer = (playerId, pokemon) => {
    const newPoke = {
      id: Date.now(),
      pokeId: pokemon.pokeId,
      name: pokemon.name,
      types: pokemon.types || [],
      level: 50,
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

  const recordBattle = () => {
    if (!newBattleData.player1 || !newBattleData.player2 || !newBattleData.winner) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const battle = {
      id: Date.now(),
      ...newBattleData,
    };
    setBattles([...battles, battle]);

    const updatedPlayers = players.map(p => {
      if (p.id === newBattleData.player1 || p.id === newBattleData.player2) {
        const isWinner = (newBattleData.winner === 'player1' && p.id === newBattleData.player1) || 
                         (newBattleData.winner === 'player2' && p.id === newBattleData.player2);
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

    setNewBattleData({
      format: '1v1',
      player1: null,
      player2: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      winner: null,
    });
    setShowNewBattleForm(false);
  };

  // Thème colors
  const theme = {
    light: {
      bg: 'from-gray-50 to-gray-100',
      bgPrimary: 'bg-white',
      bgSecondary: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-900',
      textSecondary: 'text-gray-500',
      textTertiary: 'text-gray-400',
      headerBg: 'bg-white',
      headerBorder: 'border-gray-200',
      input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
      inputFocus: 'focus:ring-orange-500',
    },
    dark: {
      bg: 'from-gray-900 to-gray-800',
      bgPrimary: 'bg-gray-800',
      bgSecondary: 'bg-gray-700',
      border: 'border-gray-700',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      textTertiary: 'text-gray-500',
      headerBg: 'bg-gray-800',
      headerBorder: 'border-gray-700',
      input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
      inputFocus: 'focus:ring-orange-500',
    }
  };

  const t = isDark ? theme.dark : theme.light;

  // HOME PAGE
  const renderHome = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-12 px-6 border-b ${t.headerBorder}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className={`text-4xl font-black ${t.text}`}>Pokémon</h1>
            <p className="text-4xl font-black text-orange-500">Battle Tracker</p>
          </div>
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-orange-100 hover:bg-orange-200'} flex items-center justify-center transition hover:scale-110`}
          >
            {isDark ? (
              <Sun size={24} className="text-yellow-400" />
            ) : (
              <Moon size={24} className="text-orange-500" />
            )}
          </button>
        </div>
        <p className={t.textSecondary}>Enregistrez vos combats & analysez vos équipes.</p>
      </div>

      <div className="px-6 mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-purple-900' : 'bg-purple-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              <Users size={24} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
            </div>
            <p className={`${t.textSecondary} text-sm font-bold`}>JOUEURS</p>
            <p className={`text-3xl font-black ${t.text}`}>{players.length}</p>
          </div>
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-red-900' : 'bg-red-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              <Zap size={24} className={isDark ? 'text-red-400' : 'text-red-600'} />
            </div>
            <p className={`${t.textSecondary} text-sm font-bold`}>COMBATS</p>
            <p className={`text-3xl font-black ${t.text}`}>{battles.length}</p>
          </div>
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <div className={`w-12 h-12 ${isDark ? 'bg-orange-900' : 'bg-orange-100'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              <Shield size={24} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
            </div>
            <p className={`${t.textSecondary} text-sm font-bold`}>ÉQUIPES</p>
            <p className={`text-3xl font-black ${t.text}`}>{teams.length}</p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-3 pb-32">
        <button
          onClick={() => setShowNewBattleForm(true)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg transition"
        >
          + Combat
        </button>
        <button
          onClick={() => setCurrentTab('players')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black text-lg transition"
        >
          👥 Ajouter joueur
        </button>
      </div>

      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-black ${t.text}`}>📊 Combats récents</h2>
          {battles.length > 0 && (
            <button onClick={() => setCurrentTab('battles')} className="text-orange-500 font-bold text-sm">
              Voir tout →
            </button>
          )}
        </div>

        {battles.length === 0 ? (
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>
            Aucun combat
          </div>
        ) : (
          <div className="space-y-3">
            {battles.slice(-2).map((battle) => {
              const p1 = players.find(p => p.id === battle.player1);
              const p2 = players.find(p => p.id === battle.player2);
              return (
                <div key={battle.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} cursor-pointer hover:shadow-md transition`} onClick={() => {
                  setSelectedBattle(battle);
                  setCurrentTab('battleDetail');
                }}>
                  <p className="text-orange-500 text-sm font-bold mb-2">{battle.format}</p>
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${battle.winner === 'player1' ? 'text-orange-500' : t.textTertiary}`}>
                      {p1?.name || 'Joueur 1'}
                    </p>
                    <p className={`text-sm ${t.textSecondary}`}>vs</p>
                    <p className={`font-bold ${battle.winner === 'player2' ? 'text-orange-500' : t.textTertiary}`}>
                      {p2?.name || 'Joueur 2'}
                    </p>
                  </div>
                  {battle.winner && (
                    <p className="text-orange-500 text-sm text-center mt-2 font-bold">
                      🏆 {battle.winner === 'player1' ? p1?.name : p2?.name} a gagné
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewBattleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className={`w-full ${t.bgPrimary} rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-2xl font-black ${t.text} mb-6`}>Nouveau combat</h2>
            
            <div className="space-y-6">
              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>FORMAT</label>
                <select 
                  value={newBattleData.format}
                  onChange={(e) => setNewBattleData({...newBattleData, format: e.target.value})}
                  className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                >
                  <option value="1v1">1v1 (3 Pokémon)</option>
                  <option value="2v2">2v2 (4 Pokémon)</option>
                </select>
              </div>

              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>JEU</label>
                <select className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`}>
                  <option>Choisir</option>
                </select>
              </div>

              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>DATE</label>
                <input 
                  type="date" 
                  value={newBattleData.date}
                  onChange={(e) => setNewBattleData({...newBattleData, date: e.target.value})}
                  className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`} 
                />
              </div>

              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                <label className="text-orange-500 font-bold text-sm">JOUEUR 1</label>
                <select 
                  value={newBattleData.player1 || ''}
                  onChange={(e) => setNewBattleData({...newBattleData, player1: e.target.value ? parseInt(e.target.value) : null})}
                  className={`w-full border ${t.input} rounded-lg px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                >
                  <option value="">Choisir joueur</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                <label className="text-red-500 font-bold text-sm">JOUEUR 2</label>
                <select 
                  value={newBattleData.player2 || ''}
                  onChange={(e) => setNewBattleData({...newBattleData, player2: e.target.value ? parseInt(e.target.value) : null})}
                  className={`w-full border ${t.input} rounded-lg px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                >
                  <option value="">Choisir joueur</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                <label className={`${t.textSecondary} font-bold text-sm`}>GAGNANT</label>
                <select 
                  value={newBattleData.winner || ''}
                  onChange={(e) => setNewBattleData({...newBattleData, winner: e.target.value})}
                  className={`w-full border ${t.input} rounded-lg px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                >
                  <option value="">Choisir le gagnant</option>
                  {newBattleData.player1 && (
                    <option value="player1">{players.find(p => p.id === newBattleData.player1)?.name}</option>
                  )}
                  {newBattleData.player2 && (
                    <option value="player2">{players.find(p => p.id === newBattleData.player2)?.name}</option>
                  )}
                </select>
              </div>

              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>NOTES</label>
                <textarea 
                  placeholder="Notes sur le combat..." 
                  value={newBattleData.notes}
                  onChange={(e) => setNewBattleData({...newBattleData, notes: e.target.value})}
                  className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`} 
                  rows="4" 
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewBattleForm(false)}
                  className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${t.text} py-3 rounded-xl font-bold transition`}
                >
                  Annuler
                </button>
                <button
                  onClick={recordBattle}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black hover:bg-orange-600 transition"
                >
                  Enregistrer le combat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className={`w-full ${t.bgPrimary} rounded-t-3xl p-6`}>
            <h2 className={`text-2xl font-black ${t.text} mb-4`}>Nouveau joueur</h2>
            <input
              type="text"
              placeholder="Nom du joueur"
              id="new-player-input"
              className={`w-full border ${t.input} rounded-xl px-4 py-3 mb-4 ${t.inputFocus} outline-none`}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewPlayerForm(false);
                  document.getElementById('new-player-input').value = '';
                }}
                className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${t.text} py-3 rounded-xl font-bold transition`}
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
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black hover:bg-orange-600 transition"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // PLAYERS PAGE
  const renderPlayers = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
        <div>
          <h1 className={`text-2xl font-black ${t.text}`}>Joueurs</h1>
          <p className={`${t.textSecondary} text-sm`}>{players.length} joueurs</p>
        </div>
        <button
          onClick={() => setShowNewPlayerForm(true)}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-black hover:bg-orange-600 transition"
        >
          + Ajouter
        </button>
      </div>

      <div className="px-6 mt-6 space-y-3 pb-32">
        {players.length === 0 ? (
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>
            Aucun joueur créé
          </div>
        ) : (
          players.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                setSelectedPlayer(player);
                setCurrentTab('playerDetail');
              }}
              className={`w-full ${t.bgPrimary} rounded-2xl p-4 border ${t.border} hover:shadow-md transition text-left`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-black ${t.text} text-lg`}>{player.name}</h3>
                  <p className={`${t.textSecondary} text-sm`}>⚔️ {player.stats.wins + player.stats.losses} combats · 🏆 {player.stats.wins} victoires</p>
                </div>
                <ChevronRight className={t.textTertiary} />
              </div>
            </button>
          ))
        )}
      </div>

      {showNewPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className={`w-full ${t.bgPrimary} rounded-t-3xl p-6`}>
            <h2 className={`text-2xl font-black ${t.text} mb-4`}>Nouveau joueur</h2>
            <input
              type="text"
              placeholder="Nom du joueur"
              id="new-player-input"
              className={`w-full border ${t.input} rounded-xl px-4 py-3 mb-4 ${t.inputFocus} outline-none`}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewPlayerForm(false)}
                className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${t.text} py-3 rounded-xl font-bold transition`}
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
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black hover:bg-orange-600 transition"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // PLAYER DETAIL PAGE
  const renderPlayerDetail = () => (
    selectedPlayer && (
      <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
        <div className={`${t.headerBg} pt-6 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
          <button onClick={() => {
            setCurrentTab('players');
            setSelectedPlayer(null);
          }} className={`${t.textSecondary} hover:${t.text} transition`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-2xl font-black ${t.text}`}>{selectedPlayer.name}</h1>
          <div />
        </div>

        <div className="px-6 mt-8 pb-32">
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${isDark ? 'border-green-800' : 'border-green-200'}`}>
              <p className={`${isDark ? 'text-green-400' : 'text-green-600'} text-sm font-bold mb-2`}>VICTOIRES</p>
              <p className={`text-4xl font-black ${t.text}`}>{selectedPlayer.stats.wins}</p>
            </div>
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${isDark ? 'border-red-800' : 'border-red-200'}`}>
              <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-sm font-bold mb-2`}>DÉFAITES</p>
              <p className={`text-4xl font-black ${t.text}`}>{selectedPlayer.stats.losses}</p>
            </div>
          </div>

          <h2 className={`text-xl font-black ${t.text} mb-4 flex justify-between items-center`}>
            Pokémon
            <button
              onClick={() => setCurrentTab('addPokemon')}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-600 transition"
            >
              + Ajouter
            </button>
          </h2>

          {(selectedPlayer.pokemon || []).length === 0 ? (
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>
              Aucun Pokémon
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPlayer.pokemon.map((poke) => (
                <div key={poke.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} flex items-center justify-between hover:shadow-md transition`}>
                  <div className="flex items-center gap-4">
                    <img
                      src={getPokemonImageUrl(poke.pokeId)}
                      alt={poke.name}
                      className="w-12 h-12 object-contain"
                    />
                    <div>
                      <h3 className={`font-bold ${t.text}`}>{poke.name}</h3>
                      <div className="flex gap-1 flex-wrap">
                        {poke.types?.map((type) => (
                          <span key={type} style={{ backgroundColor: POKEMON_TYPES[type]?.color }} className="text-white text-xs font-bold px-2 py-1 rounded-full">
                            {POKEMON_TYPES[type]?.name || type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deletePokemonFromPlayer(selectedPlayer.id, poke.id)}
                    className="text-red-500 hover:text-red-600 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  );

  // ADD POKEMON PAGE
  const renderAddPokemon = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-6 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
        <button onClick={() => setCurrentTab('playerDetail')} className={`${t.textSecondary} hover:${t.text} transition`}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={`text-2xl font-black ${t.text}`}>Ajouter un Pokémon</h1>
        <div />
      </div>

      <div className="px-6 mt-6 pb-32">
        <div className="relative mb-6">
          <Search className={`absolute left-4 top-3 ${t.textSecondary}`} size={20} />
          <input
            type="text"
            placeholder="Chercher un Pokémon..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchPokemon(e.target.value);
            }}
            className={`w-full border ${t.input} rounded-xl px-4 py-3 pl-12 ${t.inputFocus} outline-none`}
            autoFocus
          />
        </div>

        {searchLoading ? (
          <div className={`text-center ${t.textSecondary}`}>
            <Loader className="animate-spin mx-auto mb-2" />
            <p>Recherche en cours...</p>
          </div>
        ) : searchTerm && searchResults.length === 0 ? (
          <div className={`${t.bgPrimary} rounded-2xl p-6 text-center border ${t.border} ${t.textSecondary}`}>
            Aucun résultat trouvé
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
                className={`w-full ${t.bgPrimary} rounded-2xl p-4 hover:shadow-md transition flex items-center gap-4 border ${t.border}`}
              >
                <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-12 h-12 object-contain" />
                <div className="flex-1 text-left">
                  <h3 className={`font-bold ${t.text}`}>{poke.name}</h3>
                  <p className={`text-xs ${t.textSecondary}`}>#{poke.pokeId}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className={`${t.bgPrimary} rounded-2xl p-6 text-center border ${t.border} ${t.textSecondary}`}>
            Commence à taper un nom...
          </div>
        )}
      </div>
    </div>
  );

  // BATTLES PAGE
  const renderBattles = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
        <div>
          <h1 className={`text-2xl font-black ${t.text}`}>Combats</h1>
          <p className={`${t.textSecondary} text-sm`}>{battles.length} combats</p>
        </div>
        <button
          onClick={() => setShowNewBattleForm(true)}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-black hover:bg-orange-600 transition"
        >
          + Nouveau
        </button>
      </div>

      <div className="px-6 mt-6 space-y-3 pb-32">
        {battles.length === 0 ? (
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>
            Aucun combat enregistré
          </div>
        ) : (
          battles.map((battle) => {
            const p1 = players.find(p => p.id === battle.player1);
            const p2 = players.find(p => p.id === battle.player2);
            return (
              <button
                key={battle.id}
                onClick={() => {
                  setSelectedBattle(battle);
                  setCurrentTab('battleDetail');
                }}
                className={`w-full ${t.bgPrimary} rounded-2xl p-4 border ${t.border} hover:shadow-md transition text-left`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-orange-500 text-sm font-bold">{battle.format}</p>
                  <p className={`${t.textSecondary} text-sm`}>{battle.date}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`font-bold ${battle.winner === 'player1' ? 'text-orange-500' : t.textTertiary}`}>
                    {p1?.name || 'Joueur 1'}
                  </p>
                  <p className={`${t.textSecondary} text-sm`}>vs</p>
                  <p className={`font-bold ${battle.winner === 'player2' ? 'text-orange-500' : t.textTertiary}`}>
                    {p2?.name || 'Joueur 2'}
                  </p>
                </div>
                {battle.winner && (
                  <p className="text-orange-500 text-sm text-center mt-2 font-bold">
                    🏆 {battle.winner === 'player1' ? p1?.name : p2?.name} a gagné
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // BATTLE DETAIL PAGE
  const renderBattleDetail = () => (
    selectedBattle && (
      <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
        <div className={`${t.headerBg} pt-6 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
          <button onClick={() => {
            setCurrentTab('battles');
            setSelectedBattle(null);
          }} className={`${t.textSecondary} hover:${t.text} transition`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-2xl font-black ${t.text}`}>Détail du combat</h1>
          <button className="text-red-500 hover:text-red-600 transition">
            <Trash2 size={24} />
          </button>
        </div>

        <div className="px-6 mt-6 pb-32">
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} mb-6`}>
            <p className="text-orange-500 text-sm font-bold mb-2">{selectedBattle.format}</p>
            <p className={`${t.textSecondary} text-sm mb-4`}>{selectedBattle.date}</p>
            
            <div className="flex items-center justify-between mb-4">
              <p className={`font-black ${t.text}`}>{players.find(p => p.id === selectedBattle.player1)?.name}</p>
              <p className={t.textSecondary}>VS</p>
              <p className={`font-black ${t.text}`}>{players.find(p => p.id === selectedBattle.player2)?.name}</p>
            </div>

            {selectedBattle.winner && (
              <div className={`${isDark ? 'bg-orange-900' : 'bg-orange-50'} rounded-lg p-4 text-center`}>
                <p className={isDark ? 'text-orange-400' : 'text-orange-600'} className="font-bold">
                  🏆 {selectedBattle.winner === 'player1' ? players.find(p => p.id === selectedBattle.player1)?.name : players.find(p => p.id === selectedBattle.player2)?.name} a gagné!
                </p>
              </div>
            )}
          </div>

          {selectedBattle.notes && (
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border}`}>
              <h3 className={`font-bold ${t.text} mb-2`}>Notes</h3>
              <p className={t.textSecondary}>{selectedBattle.notes}</p>
            </div>
          )}
        </div>
      </div>
    )
  );

  // TEAMS PAGE
  const renderTeams = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder} flex justify-between items-center`}>
        <div>
          <h1 className={`text-2xl font-black ${t.text}`}>Équipes</h1>
          <p className={`${t.textSecondary} text-sm`}>{teams.length} équipes</p>
        </div>
        <button 
          onClick={() => setShowNewTeamForm(true)}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-black hover:bg-orange-600 transition">
          + Créer
        </button>
      </div>

      <div className="px-6 mt-6 space-y-3 pb-32">
        {teams.length === 0 ? (
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>
            Aucune équipe créée
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} hover:shadow-md transition cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-black ${t.text}`}>{team.name}</h3>
                  <p className={`${t.textSecondary} text-sm`}>{team.owner} · {team.pokemon.length} Pokémon · {team.format}</p>
                </div>
                <ChevronRight className={t.textTertiary} />
              </div>
            </div>
          ))
        )}
      </div>

      {showNewTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className={`w-full ${t.bgPrimary} rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-2xl font-black ${t.text} mb-6`}>Créer une équipe</h2>
            
            <div className="space-y-6">
              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>NOM DE L'ÉQUIPE</label>
                <input 
                  type="text"
                  placeholder="Ex: Frontale, Spéciale..."
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
                  className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                  autoFocus
                />
              </div>

              <div>
                <label className={`${t.textSecondary} font-bold text-sm`}>PROPRIÉTAIRE</label>
                <select 
                  value={newTeamData.owner || ''}
                  onChange={(e) => setNewTeamData({...newTeamData, owner: e.target.value})}
                  className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 ${t.inputFocus} outline-none`}
                >
                  <option value="">Choisir un joueur</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewTeamForm(false);
                    setNewTeamData({ name: '', owner: null, pokemon: [] });
                  }}
                  className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${t.text} py-3 rounded-xl font-bold transition`}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (newTeamData.name.trim() && newTeamData.owner) {
                      const owner = players.find(p => p.id === parseInt(newTeamData.owner));
                      const newTeam = {
                        id: Date.now(),
                        name: newTeamData.name,
                        owner: owner?.name,
                        pokemon: [],
                        format: '2v2',
                      };
                      setTeams([...teams, newTeam]);
                      setShowNewTeamForm(false);
                      setNewTeamData({ name: '', owner: null, pokemon: [] });
                    } else {
                      alert('Veuillez remplir tous les champs');
                    }
                  }}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black hover:bg-orange-600 transition"
                >
                  Créer l'équipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen`}>
      {/* Content */}
      {currentTab === 'home' && renderHome()}
      {currentTab === 'players' && renderPlayers()}
      {currentTab === 'playerDetail' && renderPlayerDetail()}
      {currentTab === 'addPokemon' && renderAddPokemon()}
      {currentTab === 'battles' && renderBattles()}
      {currentTab === 'battleDetail' && renderBattleDetail()}
      {currentTab === 'teams' && renderTeams()}

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 ${t.headerBg} border-t ${t.headerBorder} flex justify-around items-center px-4 py-4 z-40`}>
        <button
          onClick={() => {
            setCurrentTab('home');
            setSelectedPlayer(null);
            setSelectedBattle(null);
          }}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'home' ? 'text-orange-500' : `${t.textSecondary} hover:${t.text}`
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-bold">Accueil</span>
        </button>

        <button
          onClick={() => setCurrentTab('players')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'players' || currentTab === 'playerDetail' || currentTab === 'addPokemon' 
              ? `text-orange-500` 
              : `${t.textSecondary} hover:${t.text}`
          }`}
        >
          <Users size={24} />
          <span className="text-xs font-bold">Joueurs</span>
        </button>

        <button
          onClick={() => setShowNewBattleForm(true)}
          className="flex flex-col items-center gap-1 py-2 px-4 rounded-2xl bg-orange-500 text-white font-bold -mt-8 w-16 h-16 hover:bg-orange-600 transition"
        >
          <Plus size={28} />
          <span className="text-xs">Combat</span>
        </button>

        <button
          onClick={() => setCurrentTab('battles')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'battles' || currentTab === 'battleDetail' ? 'text-orange-500' : `${t.textSecondary} hover:${t.text}`
          }`}
        >
          <Zap size={24} />
          <span className="text-xs font-bold">Combats</span>
        </button>

        <button
          onClick={() => setCurrentTab('teams')}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition ${
            currentTab === 'teams' ? `text-orange-500` : `${t.textSecondary} hover:${t.text}`
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
