// import React, { useState, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { generateId } from '../helpers'
// import { useUser } from '../contexts/UserContext'
// import { useSocket } from '../contexts/SocketContext'
// import Loader from './Loader'

// import { inDevelopment } from '../vars'

// export default function Menu() {
//   const [myGames, setMyGames] = useState()
//   const [loading, setLoading] = useState(false)
//   const [isPrivate, setIsPrivate] = useState()
//   const [onlineUsers, setOnlineUsers] = useState([])
//   const navigate = useNavigate()
//   const socket = useSocket()
//   const { username, id } = useUser()
//   let showOnline = true;
  
//   useEffect(() => {
//     if(!socket) return
//     socket.emit('username', username)
//   }, [username, socket])

//   useEffect(() => {
//     if(!socket) return
//     function gotogame(id) {
//       navigate('/game/' + id)
//     }
//     socket.on('game id', gotogame)
//     socket.emit('get-users')
//     socket.on('get-users', _users => {
//       setOnlineUsers(_users)
//     })
//     return () => {
//       socket.off('game id')
//       socket.off('get-users')
//     }
//   }, [socket])

//   return (
//     <div className='menu'>
//       { 
//         loading ? <Loader /> :
//         <>
//           <div className='menu-title'><img src='/bP.png' /><h1>Chess</h1></div>
//           <div className='menu-buttons'>
//             <button onClick={() => {
//               setLoading(true)
//               socket.emit('create')
//             }}>Private Game<span>send a link to a friend</span></button>
//             <button onClick={() => {
//               setLoading(true)
//               socket.emit('waitlist', username)
//             }}>Random Opponent<span>battle with unknown player</span></button>
//           </div>
//           { showOnline && <div style={{position: 'fixed', top: '2em', left: '2em'}}>Online: {onlineUsers.length}</div> }
//           { /* <div className='footer'>Sound from <a href="https://www.zapsplat.com">Zapsplat.com</a></div> */ }
//           { inDevelopment && <div className='slide-down develop-message'>Development in process. Sorry for any inconvenience.</div> }
//         </>
//       }
//     </div>
//   )
// }

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useSocket } from '../contexts/SocketContext';
import Loader from './Loader';

import { inDevelopment } from '../vars';

export default function Menu() {
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const navigate = useNavigate();
  const socket = useSocket();
  const { username } = useUser();
  const [gameId, setGameid] = useState(0);
  let showOnline = true;
  useEffect(() => {
    if (!socket) return;
    socket.emit('username', username);
  }, [username, socket]);

  useEffect(() => {
    if (!socket) return;
    function gotogame(id) {
      setGameid(id)
      joinGame(id)
      // navigate('/game/' + id);
    }
    socket.on('game id', gotogame);
    socket.emit('get-users');
    socket.on('get-users', _users => {
      setOnlineUsers(_users);
    });
    return () => {
      socket.off('game id');
      socket.off('get-users');
    };
  }, [socket, navigate]);

  function joinGame  (id){
    setLoading(true);
    // Use fetch to make a POST request to the join endpoint
    fetch('http://localhost:8000/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, gameId :id, status: 'Active' }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Joined game:', data);
        setLoading(false);
        // Navigate to the game page or perform other actions
        navigate('/game/' + data.user.gameId);
      })
      .catch(error => {
        console.error('Error joining game:', error);
        setLoading(false);
        // Handle the error as needed
      });
    }    

  

  return (
        <div className='menu'>
      { 
        loading ? <Loader /> :
        <>
          <div className='menu-title'><img src='/bP.png' /><h1>Chess</h1></div>
          <div className='menu-buttons'>
            <button onClick={() => {
              setLoading(true)
              socket.emit('create')
            }}>Private Game<span>send a link to a friend</span></button>
            <button onClick={() => {
              setLoading(true)
              socket.emit('waitlist', username)
            }}>Random Opponent<span>battle with unknown player</span></button>
          </div>
          { showOnline && <div style={{position: 'fixed', top: '2em', left: '2em'}}>Online: {onlineUsers.length}</div> }
          { /* <div className='footer'>Sound from <a href="https://www.zapsplat.com">Zapsplat.com</a></div> */ }
          { inDevelopment && <div className='slide-down develop-message'>Development in process. Sorry for any inconvenience.</div> }
        </>
      }
    </div>
  );
}
