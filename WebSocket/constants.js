
function ReverseObject(obj) {
    return Object.fromEntries(Object.entries(obj).map(([l,i])=>[i,Number(l)]))
}
let eDestroyReason = {
    "0": "Silent",
    "1": "Collision",
    "2": "Fall",
    "3": "Damage",
    "4": "BulletImpact",
    "5": "Goal"
}
let eTeamName = {
    "0": "Red",
    "1": "Blue",
    "2": "Spectator"
}
let ePlayerEvent = {
    "0": "CollectedPowerup",
    "1": "UsedPowerup",
    "2": "PlayerDisabled"
}
let eCommandType = {
    "0": "Drive",
    "1": "Boost",
    "2": "Use"
}
let eEntityType = {
    "0": "Character",
    "1": "Ball",
    "2": "BallSpawn",
    "3": "PuSpawn",
    "4": "Powerup",
    "6": "BlueNet",
    "7": "BlueSpawn",
    "8": "RedNet",
    "9": "RedSpawn",
    "10": "Fence",
    "11": "Bullet",
    "12": "Rectcollider",
    "13": "Lrgcollider",
    "14": "Outofbounds",
    "15": "RedExtraSpawn",
    "16": "BlueExtraSpawn",
    "17": "RedSidelineSpawn",
    "18": "BlueSidelineSpawn"
}
let eGameState = {
    "0": "Warmup",
    "1": "Prepare",
    "2": "Countdown",
    "3": "Game",
    "4": "Celebration",
    "5": "Gameover"
}
let ePacketID = {
    "0": "Invalid",
    "1": "Authenticate",
    "2": "Initialize",
    "3": "Connection",
    "4": "Disconnection",
    "5": "Chat",
    "6": "Transform",
    "7": "Command",
    "8": "Modify",
    "9": "Destroy",
    "10": "SpawnRequest",
    "11": "Announcement",
    "12": "Gamestate",
    "13": "ChangeTeam",
    "14": "UpdatePlayers",
    "15": "PlayerEvent",
    "16": "PlayerRecords",
    "17": "PlayerRecordUpdate",
    "18": "ReceiveChallenges",
    "19": "CancelChallenge"
}

let cons = {ePacketID,eCommandType,eEntityType,eGameState,ePlayerEvent,eTeamName,eDestroyReason}
for (var key in cons) {
    cons[key] = {...cons[key],...ReverseObject(cons[key])}
}

module.exports = {...cons};