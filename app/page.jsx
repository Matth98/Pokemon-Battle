'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, Plus, Zap, Shield, Moon, Sun, ArrowLeft } from 'lucide-react';

// Charger Font Awesome
if (typeof document !== 'undefined' && !document.querySelector('link[href*="font-awesome"]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(link);
}

// Ajouter CSS pour fixer l'input date sur iOS
if (typeof document !== 'undefined' && !document.querySelector('style[data-date-fix]')) {
  const style = document.createElement('style');
  style.setAttribute('data-date-fix', 'true');
  style.textContent = `
    input[type="date"] {
      -webkit-appearance: none;
      appearance: none;
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
}

const PokemonBattleLogger = () => {
  // THEME
  const [isDark, setIsDark] = useState(false);
  const theme = {
    light: { bg: 'from-gray-50 to-gray-100', bgPrimary: 'bg-white', border: 'border-gray-200', text: 'text-gray-900', textSecondary: 'text-gray-500', headerBg: 'bg-white', headerBorder: 'border-gray-200', input: 'bg-white border-gray-300 text-gray-900' },
    dark: { bg: 'from-gray-900 to-gray-800', bgPrimary: 'bg-gray-800', border: 'border-gray-700', text: 'text-white', textSecondary: 'text-gray-400', headerBg: 'bg-gray-800', headerBorder: 'border-gray-700', input: 'bg-gray-700 border-gray-600 text-white' }
  };
  const t = isDark ? theme.dark : theme.light;

  // STATE
  const [currentTab, setCurrentTab] = useState('home');
  const [players, setPlayers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [showNewBattleForm, setShowNewBattleForm] = useState(false);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);

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
    format: '2v2',
    pokemon: [],
  });

  // POKEMON SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [teamSearchStep, setTeamSearchStep] = useState('create'); // 'create' ou 'pokemon'
  const [addingPokemonToTeam, setAddingPokemonToTeam] = useState(null); // teamId ou null
  const [addingPokemonToPlayer, setAddingPokemonToPlayer] = useState(null); // playerId ou null
  const [pokemonNamesCache, setPokemonNamesCache] = useState({}); // Cache des noms français
  const [deletingPokemon, setDeletingPokemon] = useState(null); // { playerId/teamId, pokemonId, type: 'player'/'team' }
  
  // MODE SÉLECTION
  const [selectionMode, setSelectionMode] = useState(null); // 'players', 'pokemon', 'teams' ou null
  const [selectedItems, setSelectedItems] = useState([]); // IDs des items sélectionnés
  const [deletingSelected, setDeletingSelected] = useState(false); // Modale de confirmation

  // LOAD/SAVE
  useEffect(() => {
    const saved = localStorage.getItem('pb_players');
    const savedBattles = localStorage.getItem('pb_battles');
    const savedTeams = localStorage.getItem('pb_teams');
    const savedTheme = localStorage.getItem('pb_theme');
    
    let loadedPlayers = saved ? JSON.parse(saved) : [];
    let loadedTeams = savedTeams ? JSON.parse(savedTeams) : [];

    // MIGRATION: Ajouter ownerId aux joueurs s'ils ne l'ont pas
    loadedPlayers = loadedPlayers.map(p => ({
      ...p,
      ownerId: p.ownerId || p.id // ownerId = id du joueur
    }));

    // MIGRATION: Ajouter ownerId aux équipes s'ils ne l'ont pas (chercher le joueur par nom)
    loadedTeams = loadedTeams.map(t => {
      if (!t.ownerId && t.owner) {
        const ownerPlayer = loadedPlayers.find(p => p.name === t.owner);
        return {
          ...t,
          ownerId: ownerPlayer?.id || null
        };
      }
      return t;
    });

    setPlayers(loadedPlayers);
    if (savedBattles) setBattles(JSON.parse(savedBattles));
    setTeams(loadedTeams);
    if (savedTheme) setIsDark(savedTheme === 'dark');

    // Charger les noms français des Pokémon
    loadPokemonNames();
  }, []);

  const loadPokemonNames = async () => {
    try {
      const cache = {};
      for (let i = 1; i <= 1025; i++) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}/`);
          const data = await response.json();
          const frenchName = data.names?.find(n => n.language.name === 'fr')?.name || data.name;
          cache[i] = { fr: frenchName, en: data.name };
        } catch (error) {
          // Skip si erreur
        }
      }
      setPokemonNamesCache(cache);
      localStorage.setItem('pb_pokemon_names', JSON.stringify(cache));
    } catch (error) {
      console.error('Erreur chargement noms:', error);
      // Essayer de charger depuis le cache local
      const cached = localStorage.getItem('pb_pokemon_names');
      if (cached) setPokemonNamesCache(JSON.parse(cached));
    }
  };

  useEffect(() => {
    localStorage.setItem('pb_players', JSON.stringify(players));
    localStorage.setItem('pb_battles', JSON.stringify(battles));
    localStorage.setItem('pb_teams', JSON.stringify(teams));
    localStorage.setItem('pb_theme', isDark ? 'dark' : 'light');
  }, [players, battles, teams, isDark]);

  // FUNCTIONS
  const addPlayer = (name) => {
    setPlayers([...players, { id: Date.now(), name, stats: { wins: 0, losses: 0 } }]);
  };

  const recordBattle = () => {
    if (!newBattleData.player1 || !newBattleData.player2 || !newBattleData.winner) {
      alert('Remplissez tous les champs');
      return;
    }

    setBattles([...battles, { id: Date.now(), ...newBattleData }]);

    const updatedPlayers = players.map(p => {
      const isWinner = (newBattleData.winner === 'player1' && p.id === newBattleData.player1) || 
                       (newBattleData.winner === 'player2' && p.id === newBattleData.player2);
      if (p.id === newBattleData.player1 || p.id === newBattleData.player2) {
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

    setNewBattleData({ format: '1v1', player1: null, player2: null, date: new Date().toISOString().split('T')[0], notes: '', winner: null });
    setShowNewBattleForm(false);
  };

  const createTeam = () => {
    if (!newTeamData.name.trim() || !newTeamData.owner) {
      alert('Remplissez le nom et le propriétaire');
      return;
    }

    const ownerId = parseInt(newTeamData.owner);
    const owner = players.find(p => p.id === ownerId);

    // Ajouter les Pokémon NOUVEAUX à la liste perso du joueur
    const newPlayers = players.map(p => {
      if (p.id === ownerId) {
        const currentPokemonIds = p.pokemon?.map(pk => pk.pokeId) || [];
        const newPokemon = newTeamData.pokemon.filter(tp => !currentPokemonIds.includes(tp.pokeId));
        
        return {
          ...p,
          pokemon: [...(p.pokemon || []), ...newPokemon.map(pk => ({ ...pk, id: Date.now() + Math.random() }))]
        };
      }
      return p;
    });

    setPlayers(newPlayers);
    setTeams([...teams, { 
      id: Date.now(), 
      ...newTeamData, 
      owner: owner?.name || 'Inconnu', 
      ownerId: ownerId
    }]);
    setNewTeamData({ name: '', owner: null, format: '2v2', pokemon: [] });
    setShowNewTeamForm(false);
    setTeamSearchStep('create');
  };

  const getPokemonImageUrl = (id) => {
    return `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  // SÉLECTION MULTIPLE
  const toggleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = (items) => {
    setSelectedItems(items.map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const deleteSelectedPlayers = () => {
    const newPlayers = players.filter(p => !selectedItems.includes(p.id));
    setPlayers(newPlayers);
    setSelectedItems([]);
    setSelectionMode(null);
    setDeletingSelected(false);
  };

  const deleteSelectedTeams = () => {
    const newTeams = teams.filter(t => !selectedItems.includes(t.id));
    setTeams(newTeams);
    setSelectedItems([]);
    setSelectionMode(null);
    setDeletingSelected(false);
  };

  const searchPokemon = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = [];
      
      // Chercher dans le cache
      for (const [pokeId, names] of Object.entries(pokemonNamesCache)) {
        if (results.length >= 20) break;
        
        if (names.fr.toLowerCase().includes(query.toLowerCase()) || 
            names.en.toLowerCase().includes(query.toLowerCase())) {
          results.push({ 
            pokeId: parseInt(pokeId), 
            name: names.fr,
            englishName: names.en 
          });
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

  const addPokemonToPlayer = (playerId, pokemon) => {
    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          pokemon: [...(p.pokemon || []), { id: Date.now(), pokeId: pokemon.pokeId, name: pokemon.name, level: 50 }]
        };
      }
      return p;
    });
    setPlayers(newPlayers);
    setSelectedPlayer(newPlayers.find(p => p.id === playerId));
    setAddingPokemonToPlayer(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const deletePokemonFromPlayer = (playerId, pokemonId) => {
    const player = players.find(p => p.id === playerId);
    const pokemonToDelete = player?.pokemon?.find(pk => pk.id === pokemonId);

    // Retirer de la liste perso
    const newPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          pokemon: (p.pokemon || []).filter(pk => pk.id !== pokemonId)
        };
      }
      return p;
    });

    // Retirer aussi des équipes du joueur (utiliser ownerId)
    const newTeams = teams.map(t => {
      if (t.ownerId === playerId && pokemonToDelete) {
        return {
          ...t,
          pokemon: (t.pokemon || []).filter(pk => pk.pokeId !== pokemonToDelete.pokeId)
        };
      }
      return t;
    });

    setPlayers(newPlayers);
    setTeams(newTeams);
    setSelectedPlayer(newPlayers.find(p => p.id === playerId));
  };

  const deletePokemonFromTeam = (teamId, pokemonId) => {
    const newTeams = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          pokemon: (t.pokemon || []).filter(pk => pk.id !== pokemonId)
        };
      }
      return t;
    });
    setTeams(newTeams);
    setSelectedTeam(newTeams.find(t => t.id === teamId));
  };

  const addPokemonToTeam = (teamId, pokemon, shouldAddToPlayer = true) => {
    const team = teams.find(t => t.id === teamId);
    
    const newTeams = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          pokemon: [...(t.pokemon || []), { id: Date.now(), pokeId: pokemon.pokeId, name: pokemon.name }]
        };
      }
      return t;
    });
    setTeams(newTeams);
    setSelectedTeam(newTeams.find(t => t.id === teamId));

    // Ajouter aussi à la liste perso du joueur si c'est un nouveau Pokémon
    if (shouldAddToPlayer && team) {
      const ownerId = team.ownerId || team.owner;
      const player = players.find(p => p.id === parseInt(ownerId) || p.id === ownerId);
      
      if (player) {
        const alreadyHas = player.pokemon?.some(pk => pk.pokeId === pokemon.pokeId);
        if (!alreadyHas) {
          console.log('Ajout du Pokémon à la liste perso:', pokemon.name, 'pour', player.name);
          addPokemonToPlayer(player.id, pokemon);
        }
      }
    }

    setAddingPokemonToTeam(null);
    setSearchTerm('');
    setSearchResults([]);
  };;

  // PAGES
  const renderHome = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-12 px-6 border-b ${t.headerBorder}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className={`text-4xl font-black ${t.text}`}>Pokémon</h1>
            <p className="text-4xl font-black text-orange-500">Battle Tracker</p>
          </div>
          <button onClick={() => setIsDark(!isDark)} className={`w-12 h-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-orange-100'} flex items-center justify-center`}>
            {isDark ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-orange-500" />}
          </button>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-4 pb-32">
        <div className="grid grid-cols-3 gap-4">
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <p className={`${t.textSecondary} text-sm font-bold`}>JOUEURS</p>
            <p className={`text-3xl font-black ${t.text}`}>{players.length}</p>
          </div>
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <p className={`${t.textSecondary} text-sm font-bold`}>COMBATS</p>
            <p className={`text-3xl font-black ${t.text}`}>{battles.length}</p>
          </div>
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center`}>
            <p className={`${t.textSecondary} text-sm font-bold`}>ÉQUIPES</p>
            <p className={`text-3xl font-black ${t.text}`}>{teams.length}</p>
          </div>
        </div>

        <button onClick={() => setShowNewBattleForm(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-lg transition">
          + Combat
        </button>

        <div className="mt-12">
          <h2 className={`text-xl font-black ${t.text} mb-4`}>📊 Combats récents</h2>
          {battles.length === 0 ? (
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>Aucun combat</div>
          ) : (
            battles.slice(-2).map(b => {
              const p1 = players.find(p => p.id === b.player1);
              const p2 = players.find(p => p.id === b.player2);
              return (
                <button key={b.id} onClick={() => { setSelectedBattle(b); setCurrentTab('battleDetail'); }} className={`w-full ${t.bgPrimary} rounded-2xl p-4 border ${t.border} mb-2 text-left hover:shadow-md transition`}>
                  <p className="text-orange-500 text-sm font-bold">{b.format}</p>
                  <div className="flex justify-between mt-2">
                    <p className={`font-bold ${b.winner === 'player1' ? 'text-orange-500' : t.textSecondary}`}>{p1?.name}</p>
                    <p className={`font-bold ${b.winner === 'player2' ? 'text-orange-500' : t.textSecondary}`}>{p2?.name}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayers = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-black ${t.text}`}>👥 Joueurs</h1>
          <div className="flex gap-2">
            {selectionMode === 'players' ? (
              <>
                <button onClick={() => { setSelectionMode(null); setSelectedItems([]); }} className={`border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} px-3 py-1 rounded-full font-bold text-sm transition`}>Annuler</button>
                <button onClick={() => setDeletingSelected(true)} disabled={selectedItems.length === 0} className="bg-red-500 disabled:opacity-50 text-white px-3 py-2 rounded-full font-bold text-sm">🗑️ Supprimer</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowNewPlayerForm(true)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">+ Ajouter</button>
                {players.length > 0 && (
                  <button onClick={() => setSelectionMode('players')} className={`w-10 h-10 rounded-full ${isDark ? 'bg-orange-500 bg-opacity-20' : 'bg-orange-100'} flex items-center justify-center transition hover:bg-opacity-30`}>
                    <i className="fa-solid fa-list-check text-orange-500 text-lg"></i>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {selectionMode === 'players' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => selectAllItems(players)} className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-xs">Tout sélectionner</button>
            <button onClick={deselectAllItems} className={`border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} px-3 py-1 rounded-full font-bold text-xs transition`}>Tout désélectionner</button>
          </div>
        )}
      </div>
      
      <div className="px-6 mt-6 pb-32 space-y-3">
        {players.length === 0 ? (
          <div className="h-screen flex items-center justify-center -mt-20">
            <div className="text-center">
              <p className={`text-6xl mb-4`}>👥</p>
              <h2 className={`text-2xl font-black ${t.text} mb-2`}>Aucun joueur</h2>
              <p className={`${t.textSecondary} mb-6`}>Crée ton premier joueur pour commencer!</p>
              <button onClick={() => setShowNewPlayerForm(true)} className="bg-orange-500 text-white px-6 py-3 rounded-full font-black">+ Créer un joueur</button>
            </div>
          </div>
        ) : (
          players.map(p => (
            <div key={p.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} flex items-center gap-4 ${selectionMode === 'players' ? 'cursor-pointer hover:shadow-md transition' : ''}`}>
              {selectionMode === 'players' && (
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(p.id)} 
                  onChange={() => toggleSelectItem(p.id)} 
                  className="w-5 h-5 cursor-pointer"
                />
              )}
              <button 
                onClick={() => !selectionMode && (setSelectedPlayer(p), setCurrentTab('playerDetail'))} 
                disabled={selectionMode === 'players'}
                className="flex-1 text-left disabled:opacity-50"
              >
                <h3 className={`font-black ${t.text}`}>{p.name}</h3>
                <p className={`${t.textSecondary} text-sm`}>⚔️ {p.stats.wins + p.stats.losses} combats · 🏆 {p.stats.wins}V</p>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;
    return (
      <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
        <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
          <button onClick={() => { setCurrentTab('players'); setSelectedPlayer(null); }} className="text-orange-500 mb-4 font-bold">← Retour</button>
          <h1 className={`text-2xl font-black ${t.text}`}>{selectedPlayer.name}</h1>
          <p className={`${t.textSecondary}`}>🏆 {selectedPlayer.stats.wins}V - {selectedPlayer.stats.losses}D</p>
        </div>
        <div className="px-6 mt-6 pb-32">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-black ${t.text}`}>Pokémon ({(selectedPlayer.pokemon || []).length})</h2>
            <button onClick={() => setAddingPokemonToPlayer(selectedPlayer.id)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">+ Ajouter</button>
          </div>
          {(!selectedPlayer.pokemon || selectedPlayer.pokemon.length === 0) ? (
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>Aucun Pokémon</div>
          ) : (
            <div className="space-y-3">
              {selectedPlayer.pokemon.map(p => (
                <div key={p.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <img src={getPokemonImageUrl(p.pokeId)} alt={p.name} className="w-12 h-12 object-contain" />
                    <div>
                      <p className={`font-black ${t.text}`}>{p.name}</p>
                      <p className={`${t.textSecondary} text-sm`}>Niveau {p.level}</p>
                    </div>
                  </div>
                  <button onClick={() => setDeletingPokemon({ entityId: selectedPlayer.id, pokemonId: p.id, type: 'player', pokemonName: p.name })} className="text-red-500 hover:text-red-600 font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBattles = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-black ${t.text}`}>⚡ Combats</h1>
          <button onClick={() => setShowNewBattleForm(true)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">+ Nouveau</button>
        </div>
      </div>
      <div className="px-6 mt-6 pb-32 space-y-3">
        {battles.length === 0 ? (
          <div className="h-screen flex items-center justify-center -mt-20">
            <div className="text-center">
              <p className={`text-6xl mb-4`}>⚡</p>
              <h2 className={`text-2xl font-black ${t.text} mb-2`}>Aucun combat</h2>
              <p className={`${t.textSecondary} mb-6`}>Enregistre ton premier combat pour commencer!</p>
              <button onClick={() => setShowNewBattleForm(true)} className="bg-orange-500 text-white px-6 py-3 rounded-full font-black">+ Enregistrer un combat</button>
            </div>
          </div>
        ) : (
          battles.map(b => {
            const p1 = players.find(p => p.id === b.player1);
            const p2 = players.find(p => p.id === b.player2);
            return (
              <button key={b.id} onClick={() => { setSelectedBattle(b); setCurrentTab('battleDetail'); }} className={`w-full ${t.bgPrimary} rounded-2xl p-4 border ${t.border} text-left hover:shadow-md transition`}>
                <p className="text-orange-500 text-sm font-bold">{b.format}</p>
                <div className="flex justify-between mt-2">
                  <p className={`font-bold ${b.winner === 'player1' ? 'text-orange-500' : t.textSecondary}`}>{p1?.name}</p>
                  <p className={`font-bold ${b.winner === 'player2' ? 'text-orange-500' : t.textSecondary}`}>{p2?.name}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const renderBattleDetail = () => {
    if (!selectedBattle) return null;
    const p1 = players.find(p => p.id === selectedBattle.player1);
    const p2 = players.find(p => p.id === selectedBattle.player2);
    return (
      <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
        <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
          <button onClick={() => { setCurrentTab('battles'); setSelectedBattle(null); }} className="text-orange-500 mb-4 font-bold">← Retour</button>
          <h1 className={`text-2xl font-black ${t.text}`}>{selectedBattle.format}</h1>
          <p className={`${t.textSecondary}`}>{selectedBattle.date}</p>
        </div>
        <div className="px-6 mt-6 pb-32">
          <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border}`}>
            <div className="flex justify-between mb-4">
              <p className={`font-bold ${t.text}`}>{p1?.name}</p>
              <p className={`${t.textSecondary}`}>vs</p>
              <p className={`font-bold ${t.text}`}>{p2?.name}</p>
            </div>
            {selectedBattle.winner && <p className="text-orange-500 font-bold">🏆 {selectedBattle.winner === 'player1' ? p1?.name : p2?.name} gagné</p>}
            {selectedBattle.notes && <p className={`${t.textSecondary} mt-4`}>{selectedBattle.notes}</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderTeams = () => (
    <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
      <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className={`text-2xl font-black ${t.text}`}>🛡️ Équipes</h1>
          <div className="flex gap-2">
            {selectionMode === 'teams' ? (
              <>
                <button onClick={() => { setSelectionMode(null); setSelectedItems([]); }} className={`border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} px-3 py-1 rounded-full font-bold text-sm transition`}>Annuler</button>
                <button onClick={() => setDeletingSelected(true)} disabled={selectedItems.length === 0} className="bg-red-500 disabled:opacity-50 text-white px-3 py-2 rounded-full font-bold text-sm">🗑️ Supprimer</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowNewTeamForm(true)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">+ Créer</button>
                {teams.length > 0 && (
                  <button onClick={() => setSelectionMode('teams')} className={`w-10 h-10 rounded-full ${isDark ? 'bg-orange-500 bg-opacity-20' : 'bg-orange-100'} flex items-center justify-center transition hover:bg-opacity-30`}>
                    <i className="fa-solid fa-list-check text-orange-500 text-lg"></i>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {selectionMode === 'teams' && (
          <div className="flex gap-2 mt-4">
            <button onClick={() => selectAllItems(teams)} className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-xs">Tout sélectionner</button>
            <button onClick={deselectAllItems} className={`border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'} px-3 py-1 rounded-full font-bold text-xs transition`}>Tout désélectionner</button>
          </div>
        )}
      </div>
      
      <div className="px-6 mt-6 pb-32 space-y-3">
        {teams.length === 0 ? (
          <div className="h-screen flex items-center justify-center -mt-20">
            <div className="text-center">
              <p className={`text-6xl mb-4`}>🛡️</p>
              <h2 className={`text-2xl font-black ${t.text} mb-2`}>Aucune équipe</h2>
              <p className={`${t.textSecondary} mb-6`}>Crée ta première équipe pour commencer!</p>
              <button onClick={() => setShowNewTeamForm(true)} className="bg-orange-500 text-white px-6 py-3 rounded-full font-black">+ Créer une équipe</button>
            </div>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} flex items-center gap-4 ${selectionMode === 'teams' ? 'cursor-pointer hover:shadow-md transition' : ''}`}>
              {selectionMode === 'teams' && (
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(team.id)} 
                  onChange={() => toggleSelectItem(team.id)} 
                  className="w-5 h-5 cursor-pointer"
                />
              )}
              <button 
                onClick={() => !selectionMode && (setSelectedTeam(team), setCurrentTab('teamDetail'))} 
                disabled={selectionMode === 'teams'}
                className="flex-1 text-left disabled:opacity-50"
              >
                <h3 className={`font-black ${t.text}`}>{team.name}</h3>
                <p className={`${t.textSecondary} text-sm`}>{team.owner} · {team.format}</p>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTeamDetail = () => {
    if (!selectedTeam) return null;
    return (
      <div className={`min-h-screen bg-gradient-to-br ${t.bg}`}>
        <div className={`${t.headerBg} pt-8 pb-6 px-6 border-b ${t.headerBorder}`}>
          <button onClick={() => { setCurrentTab('teams'); setSelectedTeam(null); }} className="text-orange-500 mb-4 font-bold">← Retour</button>
          <h1 className={`text-2xl font-black ${t.text}`}>{selectedTeam.name}</h1>
          <p className={`${t.textSecondary}`}>{selectedTeam.owner} · {selectedTeam.format}</p>
        </div>
        <div className="px-6 mt-6 pb-32">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-black ${t.text}`}>Pokémon ({(selectedTeam.pokemon || []).length})</h2>
            <button onClick={() => setAddingPokemonToTeam(selectedTeam.id)} className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">+ Ajouter</button>
          </div>
          {(!selectedTeam.pokemon || selectedTeam.pokemon.length === 0) ? (
            <div className={`${t.bgPrimary} rounded-2xl p-6 border ${t.border} text-center ${t.textSecondary}`}>Aucun Pokémon</div>
          ) : (
            <div className="space-y-3">
              {selectedTeam.pokemon.map(p => (
                <div key={p.id} className={`${t.bgPrimary} rounded-2xl p-4 border ${t.border} flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <img src={getPokemonImageUrl(p.pokeId)} alt={p.name} className="w-12 h-12 object-contain" />
                    <p className={`font-black ${t.text}`}>{p.name}</p>
                  </div>
                  <button onClick={() => setDeletingPokemon({ entityId: selectedTeam.id, pokemonId: p.id, type: 'team', pokemonName: p.name })} className="text-red-500 hover:text-red-600 font-bold">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // MAIN RETURN
  return (
    <div className="min-h-screen">
      {currentTab === 'home' && renderHome()}
      {currentTab === 'players' && renderPlayers()}
      {currentTab === 'playerDetail' && renderPlayerDetail()}
      {currentTab === 'battles' && renderBattles()}
      {currentTab === 'battleDetail' && renderBattleDetail()}
      {currentTab === 'teams' && renderTeams()}
      {currentTab === 'teamDetail' && renderTeamDetail()}

      {/* Bottom Menu - Hidden when modals open */}
      {!showNewBattleForm && !showNewPlayerForm && !showNewTeamForm && (
        <div className={`fixed bottom-0 left-0 right-0 ${t.headerBg} border-t ${t.headerBorder} flex justify-around items-center px-2 py-3 z-20`}>
          <button onClick={() => setCurrentTab('home')} className={`flex flex-col items-center gap-0.5 py-1 px-2 transition ${currentTab === 'home' ? 'text-orange-500' : t.textSecondary}`}>
            <Home size={20} />
            <span className="text-xs font-bold">Accueil</span>
          </button>
          <button onClick={() => setCurrentTab('players')} className={`flex flex-col items-center gap-0.5 py-1 px-2 transition ${currentTab === 'players' ? 'text-orange-500' : t.textSecondary}`}>
            <Users size={20} />
            <span className="text-xs font-bold">Joueurs</span>
          </button>
          <button onClick={() => setShowNewBattleForm(true)} className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl bg-orange-500 text-white font-bold -mt-6 w-14 h-14">
            <Plus size={24} />
            <span className="text-xs">Combat</span>
          </button>
          <button onClick={() => setCurrentTab('battles')} className={`flex flex-col items-center gap-0.5 py-1 px-2 transition ${currentTab === 'battles' ? 'text-orange-500' : t.textSecondary}`}>
            <Zap size={20} />
            <span className="text-xs font-bold">Combats</span>
          </button>
          <button onClick={() => setCurrentTab('teams')} className={`flex flex-col items-center gap-0.5 py-1 px-2 transition ${currentTab === 'teams' ? 'text-orange-500' : t.textSecondary}`}>
            <Shield size={20} />
            <span className="text-xs font-bold">Équipes</span>
          </button>
        </div>
      )}

      {/* MODALS */}

      {/* Modal Nouveau Combat */}
      {showNewBattleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col overflow-hidden">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col overflow-x-hidden`}>
            <div className="p-6 flex-1 overflow-y-auto w-full box-border">
              <h2 className={`text-2xl font-black ${t.text} mb-6`}>Nouveau combat</h2>
              <div className="space-y-6 w-full">
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm`}>FORMAT</label>
                  <select value={newBattleData.format} onChange={(e) => setNewBattleData({...newBattleData, format: e.target.value})} className={`w-full max-w-full border ${t.input} rounded-xl px-4 py-3 mt-2 box-border overflow-hidden`}>
                    <option value="1v1">1v1</option>
                    <option value="2v2">2v2</option>
                  </select>
                </div>
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm`}>DATE</label>
                  <input 
                    type="date" 
                    value={newBattleData.date} 
                    onChange={(e) => setNewBattleData({...newBattleData, date: e.target.value})} 
                    className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2 box-border text-left`}
                  />
                </div>
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                  <label className="text-orange-500 font-bold text-sm">JOUEUR 1</label>
                  <select value={newBattleData.player1 || ''} onChange={(e) => setNewBattleData({...newBattleData, player1: e.target.value ? parseInt(e.target.value) : null})} className={`w-full max-w-full border ${t.input} rounded-lg px-4 py-3 mt-2 box-border overflow-hidden`}>
                    <option value="">Choisir</option>
                    {players.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                  <label className="text-red-500 font-bold text-sm">JOUEUR 2</label>
                  <select value={newBattleData.player2 || ''} onChange={(e) => setNewBattleData({...newBattleData, player2: e.target.value ? parseInt(e.target.value) : null})} className={`w-full max-w-full border ${t.input} rounded-lg px-4 py-3 mt-2 box-border overflow-hidden`}>
                    <option value="">Choisir</option>
                    {players.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 border ${t.border}`}>
                  <label className={`${t.textSecondary} font-bold text-sm`}>GAGNANT</label>
                  <select value={newBattleData.winner || ''} onChange={(e) => setNewBattleData({...newBattleData, winner: e.target.value})} className={`w-full max-w-full border ${t.input} rounded-lg px-4 py-3 mt-2 box-border overflow-hidden`}>
                    <option value="">Choisir</option>
                    {newBattleData.player1 && (<option value="player1">{players.find(p => p.id === newBattleData.player1)?.name}</option>)}
                    {newBattleData.player2 && (<option value="player2">{players.find(p => p.id === newBattleData.player2)?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm`}>NOTES</label>
                  <textarea placeholder="..." value={newBattleData.notes} onChange={(e) => setNewBattleData({...newBattleData, notes: e.target.value})} className={`w-full max-w-full border ${t.input} rounded-xl px-4 py-3 mt-2 box-border overflow-hidden`} rows="3" />
                </div>
              </div>
            </div>
            <div className={`border-t ${t.headerBorder} p-6 bg-gradient-to-t ${isDark ? 'from-gray-800' : 'from-gray-50'}`}>
              <div className="flex gap-3">
                <button onClick={() => setShowNewBattleForm(false)} className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text} py-3 rounded-xl font-bold`}>Annuler</button>
                <button onClick={recordBattle} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Joueur */}
      {showNewPlayerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col`}>
            <div className="p-6 flex-1">
              <h2 className={`text-2xl font-black ${t.text} mb-4`}>Nouveau joueur</h2>
              <input type="text" placeholder="Nom" id="player-input" className={`w-full border ${t.input} rounded-xl px-4 py-3`} autoFocus />
            </div>
            <div className={`border-t ${t.headerBorder} p-6 bg-gradient-to-t ${isDark ? 'from-gray-800' : 'from-gray-50'}`}>
              <div className="flex gap-3">
                <button onClick={() => setShowNewPlayerForm(false)} className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text} py-3 rounded-xl font-bold`}>Annuler</button>
                <button onClick={() => { const input = document.getElementById('player-input'); if (input.value.trim()) { addPlayer(input.value.trim()); setShowNewPlayerForm(false); input.value = ''; } }} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black">Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créer Équipe */}
      {showNewTeamForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col`}>
            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className={`text-2xl font-black ${t.text} mb-6`}>Créer une équipe</h2>
              <div className="space-y-6">
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm`}>NOM</label>
                  <input type="text" placeholder="Ex: Frontale" value={newTeamData.name} onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})} className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2`} autoFocus />
                </div>
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm`}>PROPRIÉTAIRE</label>
                  <select value={newTeamData.owner || ''} onChange={(e) => setNewTeamData({...newTeamData, owner: e.target.value})} className={`w-full border ${t.input} rounded-xl px-4 py-3 mt-2`}>
                    <option value="">Choisir</option>
                    {players.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm mb-3 block`}>FORMAT</label>
                  <div className="flex gap-3">
                    <button onClick={() => setNewTeamData({...newTeamData, format: '1v1'})} className={`flex-1 py-3 rounded-xl font-black ${newTeamData.format === '1v1' ? 'bg-orange-500 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text}`}`}>1v1</button>
                    <button onClick={() => setNewTeamData({...newTeamData, format: '2v2'})} className={`flex-1 py-3 rounded-xl font-black ${newTeamData.format === '2v2' ? 'bg-orange-500 text-white' : `${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text}`}`}>2v2</button>
                  </div>
                </div>
                <div>
                  <label className={`${t.textSecondary} font-bold text-sm mb-3 block`}>POKÉMON ({(newTeamData.pokemon || []).length})</label>
                  <div className="space-y-2 mb-4">
                    {(newTeamData.pokemon || []).map(p => (
                      <div key={p.id} className={`${t.bgPrimary} rounded-lg p-3 flex items-center justify-between border ${t.border}`}>
                        <div className="flex items-center gap-2">
                          <img src={getPokemonImageUrl(p.pokeId)} alt={p.name} className="w-8 h-8 object-contain" />
                          <span className={`font-bold ${t.text}`}>{p.name}</span>
                        </div>
                        <button onClick={() => setNewTeamData({...newTeamData, pokemon: newTeamData.pokemon.filter(pk => pk.id !== p.id)})} className="text-red-500 text-sm font-bold">×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTeamSearchStep('pokemon')} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-black transition">+ Ajouter Pokémon</button>
                </div>
              </div>
            </div>
            <div className={`border-t ${t.headerBorder} p-6 bg-gradient-to-t ${isDark ? 'from-gray-800' : 'from-gray-50'}`}>
              <div className="flex gap-3">
                <button onClick={() => { setShowNewTeamForm(false); setNewTeamData({ name: '', owner: null, format: '2v2', pokemon: [] }); setTeamSearchStep('create'); }} className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text} py-3 rounded-xl font-bold`}>Annuler</button>
                <button onClick={createTeam} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black">Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression Multiple */}
      {deletingSelected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
          <div className={`${t.bgPrimary} rounded-3xl p-8 max-w-sm mx-4 border ${t.border}`}>
            <h2 className={`text-2xl font-black ${t.text} mb-4`}>Supprimer ces éléments?</h2>
            <p className={`${t.textSecondary} mb-6`}>Es-tu sûr de vouloir supprimer <span className="font-black">{selectedItems.length} élément{selectedItems.length > 1 ? 's' : ''}</span>?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingSelected(false)} 
                className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text} py-3 rounded-xl font-bold`}
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  if (selectionMode === 'players') {
                    deleteSelectedPlayers();
                  } else if (selectionMode === 'teams') {
                    deleteSelectedTeams();
                  }
                }} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression Pokémon */}
      {deletingPokemon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
          <div className={`${t.bgPrimary} rounded-3xl p-8 max-w-sm mx-4 border ${t.border}`}>
            <h2 className={`text-2xl font-black ${t.text} mb-4`}>Supprimer ce Pokémon?</h2>
            <p className={`${t.textSecondary} mb-6`}>Es-tu sûr de vouloir supprimer <span className="font-black">{deletingPokemon.pokemonName}</span>?</p>
            
            {deletingPokemon.type === 'player' && (() => {
              const player = players.find(p => p.id === deletingPokemon.entityId);
              const pokemon = player?.pokemon?.find(pk => pk.id === deletingPokemon.pokemonId);
              const affectedTeams = teams.filter(t => 
                t.ownerId === deletingPokemon.entityId && 
                t.pokemon?.some(pk => pk.pokeId === pokemon?.pokeId)
              );

              return affectedTeams.length > 0 ? (
                <div className={`${isDark ? 'bg-red-900 bg-opacity-30' : 'bg-red-50'} border border-red-500 rounded-xl p-4 mb-6`}>
                  <p className="text-red-500 font-bold mb-2">⚠️ Ce Pokémon est utilisé dans {affectedTeams.length} équipe{affectedTeams.length > 1 ? 's' : ''}:</p>
                  <ul className={`text-sm ${t.textSecondary} space-y-1`}>
                    {affectedTeams.map(team => (
                      <li key={team.id}>• {team.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}

            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingPokemon(null)} 
                className={`flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${t.text} py-3 rounded-xl font-bold`}
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  if (deletingPokemon.type === 'player') {
                    deletePokemonFromPlayer(deletingPokemon.entityId, deletingPokemon.pokemonId);
                  } else {
                    deletePokemonFromTeam(deletingPokemon.entityId, deletingPokemon.pokemonId);
                  }
                  setDeletingPokemon(null);
                }} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recherche Pokémon pour Joueur */}
      {addingPokemonToPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col`}>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-black ${t.text}`}>Ajouter Pokémon</h2>
                <button onClick={() => setAddingPokemonToPlayer(null)} className={`${t.textSecondary} text-2xl`}>×</button>
              </div>
              
              <div className="relative mb-6">
                <input type="text" placeholder="Chercher Pokémon..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); searchPokemon(e.target.value); }} className={`w-full border ${t.input} rounded-xl px-4 py-3`} autoFocus />
              </div>

              {searchLoading ? (
                <div className={`text-center ${t.textSecondary}`}>Recherche...</div>
              ) : searchTerm && searchResults.length === 0 ? (
                <div className={`text-center ${t.textSecondary}`}>Aucun résultat</div>
              ) : searchTerm ? (
                <div className="space-y-2">
                  {searchResults.map(poke => (
                    <button key={poke.pokeId} onClick={() => { addPokemonToPlayer(addingPokemonToPlayer, poke); }} className={`w-full ${t.bgPrimary} rounded-2xl p-4 hover:shadow-md transition flex items-center gap-4 border ${t.border}`}>
                      <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-12 h-12 object-contain" />
                      <p className={`font-black ${t.text}`}>{poke.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`text-center ${t.textSecondary}`}>Commence à taper...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Recherche Pokémon pour Équipe Existante */}
      {addingPokemonToTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col pointer-events-auto">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col pointer-events-auto`}>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-black ${t.text}`}>Ajouter Pokémon à l'équipe</h2>
                <button onClick={() => setAddingPokemonToTeam(null)} className={`${t.textSecondary} text-2xl hover:text-white`}>×</button>
              </div>
              
              <div className="relative mb-6">
                <input type="text" placeholder="Chercher Pokémon..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); searchPokemon(e.target.value); }} className={`w-full border ${t.input} rounded-xl px-4 py-3`} autoFocus />
              </div>

              {searchLoading ? (
                <div className={`text-center ${t.textSecondary}`}>Recherche en cours...</div>
              ) : searchTerm && searchResults.length === 0 ? (
                <div className={`text-center ${t.textSecondary}`}>Aucun résultat</div>
              ) : searchTerm ? (
                <div className="space-y-2">
                  {searchResults.map(poke => (
                    <button key={poke.pokeId} onClick={() => { addPokemonToTeam(addingPokemonToTeam, poke); }} className={`w-full ${t.bgPrimary} rounded-2xl p-4 hover:shadow-md transition flex items-center gap-4 border ${t.border}`}>
                      <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-12 h-12 object-contain" />
                      <p className={`font-black ${t.text}`}>{poke.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`text-center ${t.textSecondary}`}>Commence à taper un nom...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Recherche Pokémon pour Équipe - Pendant la création */}
      {showNewTeamForm && teamSearchStep === 'pokemon' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex flex-col pointer-events-auto">
          <div className={`${t.bgPrimary} flex-1 overflow-y-auto flex flex-col pointer-events-auto`}>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-black ${t.text}`}>Ajouter Pokémon à l'équipe</h2>
                <button onClick={() => setTeamSearchStep('create')} className={`${t.textSecondary} text-2xl hover:text-white`}>×</button>
              </div>
              
              <div className="relative mb-6">
                <input type="text" placeholder="Chercher Pokémon..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); searchPokemon(e.target.value); }} className={`w-full border ${t.input} rounded-xl px-4 py-3`} autoFocus />
              </div>

              {searchLoading ? (
                <div className={`text-center ${t.textSecondary}`}>Recherche en cours...</div>
              ) : searchTerm && searchResults.length === 0 ? (
                <div className={`text-center ${t.textSecondary}`}>Aucun résultat</div>
              ) : searchTerm ? (
                <div className="space-y-2">
                  {searchResults.map(poke => (
                    <button key={poke.pokeId} onClick={() => { 
                      const newPoke = { id: Date.now(), pokeId: poke.pokeId, name: poke.name };
                      setNewTeamData({...newTeamData, pokemon: [...(newTeamData.pokemon || []), newPoke]});
                      setSearchTerm('');
                      setSearchResults([]);
                      setTeamSearchStep('create');
                    }} className={`w-full ${t.bgPrimary} rounded-2xl p-4 hover:shadow-md transition flex items-center gap-4 border ${t.border}`}>
                      <img src={getPokemonImageUrl(poke.pokeId)} alt={poke.name} className="w-12 h-12 object-contain" />
                      <p className={`font-black ${t.text}`}>{poke.name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`text-center ${t.textSecondary}`}>Commence à taper un nom...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonBattleLogger;
