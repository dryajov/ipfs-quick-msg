const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')

const $peerId = document.querySelector('#peer-id')
const $message = document.querySelector('#message')
const $msgs = document.querySelector('#msgs')
const $peers = document.querySelector('#peers')
const $send = document.querySelector('#send')

const peersSet = new Set()

const fragment = window.location.hash.substr(1)
let peer
let repoName
if (fragment) {
  const pairs = fragment.split('&')
  peer = pairs[0].split('=')[1]
  repoName = pairs[1].split('=')[1]
} else {
  repoName = repo()
}

const ipfs = new IPFS({
  repo: repoName,
  EXPERIMENTAL: {
    pubsub: true
  }
})

ipfs.once('ready', () => ipfs.id((err, info) => {
  if (err) { throw err }
  console.log('IPFS node ready with address ' + info.id)
  $peerId.innerHTML = `${info.id}`

  function updatePeers () {
    $peers.innerHTML = Array.from(peersSet).map((p) => `<a href="#peer=${p}&repo=${repoName}" target="_blank" id="${p}">${p}</a>`).join(`<br>`)
  }

  const room = Room(ipfs, 'ipfs-quick-msg')

  $send.addEventListener('click', (event) => {
    if (peer) {
      room.sendTo(peer, $message.value)
      room.emit('message', {from: info.id, data: $message.value})
    } else {
      room.broadcast($message.value)
    }
  })

  if (!peer) {
    room.on('peer joined', (peer) => {
      console.log('peer ' + peer + ' joined')
      peersSet.add(peer)
      updatePeers()
    })
  } else {
    peersSet.add(peer)
    updatePeers()
  }

  room.on('peer left', (peer) => {
    console.log('peer ' + peer + ' left')
    peersSet.delete(peer)
    updatePeers()
  })

  // send and receive messages
  room.on('message', (message) => {
    console.log('got message from ' + message.from + ': ' + message.data.toString())
    const node = document.createElement(`div`)
    node.innerText = `${message.from}: ${message.data.toString()}`
    $msgs.appendChild(node)
  })
}))

function repo () {
  return 'ipfs/pubsub-demo/' + Math.random()
}
