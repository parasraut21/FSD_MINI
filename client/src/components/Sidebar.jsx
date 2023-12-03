import React from 'react'

import Messages from './Messages'
import PGNViewer from './PGNViewer'
import TapMessages from './TapMessages'
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GamesContext'
import { allowLiveChat } from '../vars'
import { useUser } from '../contexts/UserContext'


export default function Sidebar({ gameId }) {
  const { game, gameOver, publicGame } = useGame()
  const { username } = useUser();
  const navigate = useNavigate();
  const leaveGame = () => {
    // Use fetch to make a POST request to the leave endpoint
    fetch('http://localhost:8000/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Left game:', data);
        navigate('/');
     
      })
      .catch(error => {
        console.error('Error leaving game:', error);
        // Handle the error as needed
      });
  };
  return (
    <React.Fragment>
      <div className='sidebar-header'>
  
        <h3 
          style={{textAlign: 'center'}}>
          {gameOver ? 'Game Over ' + gameOver.result : game && game.turn() === 'w' ? "White to move" : "Black to move"}
        </h3>
      </div>
      <div className='game-sidebar'>
        <PGNViewer />
        {
          publicGame && !allowLiveChat ? <TapMessages gameId={gameId} /> : <Messages gameId={gameId} />
        }
      </div>
      <div>
        <button onClick={leaveGame} >Leave Game</button>
        <br />
        </div>
    </React.Fragment>
  )
}