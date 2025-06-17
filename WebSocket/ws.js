const WebSocket = require('ws');
const { Packet, MessageParser } = require("./MessagePacker")
const { ePacketID, eGameState, eEntityType, eCommandType } = require("./constants")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class GameStateManager {
    constructor(seconds) {
        this.roundTime = seconds;
        this.timeRemaining = seconds;
        this.teams = [
            { teamId: 0, score: 0 },
            { teamId: 1, score: 0 }
        ];
        this.creationTimeStamp = new Date().getTime();
        this.gameState = eGameState.Warmup;
    }
    getTime() {
        return (new Date().getTime() - this.creationTimeStamp) / 1e3
    }
    updateScore(teamId, score) {
        this.teams.find(l => l.teamId == teamId).score = score;
    }
    updateTimeRemaining() {
        if (this.timeRemaining - this.getTime() < 0) this.timeRemaining = 0;
        else this.timeRemaining -= this.getTime()
    }
    ObjectToPacketFormat() {
        return { teams: this.teams, timeRemaining: this.timeRemaining, gameState: this.gameState }
    }
    OnScored() {
        this.gameState = eGameState.Warmup;
    }
    async Initialize() {
        await sleep(1e3);
        this.gameState = eGameState.Prepare;
        this.OnTimeChanged(this.ObjectToPacketFormat())
        await sleep(3e3);
        this.creationTimeStamp = new Date().getTime();
        this.gameState = eGameState.Game;
        this.updateTimeRemaining();
        this.OnTimeChanged(this.ObjectToPacketFormat())
        await sleep(this.roundTime);
        this.timeRemaining = seconds;
        this.OnTimeChanged(this.ObjectToPacketFormat())
    }
}



class PacketHandler {
    hostName = "ZpayerTEST";
    static Functions = {}
    static ids = [100, 1000];
    static game = {
        started: false,
        players: {},
        entities: {},
        gamestate: {},
    }
    config = { speed: 0.3 };
    constructor(ws) {
        this.ws = ws;
        this.InitializeGame();
    }
    command = { x: 0, z: 0 }

    addPlayer(ws, uid, team, skinId, bot, experience, name, position) {
        const id = PacketHandler.ids[0]++;
        const entityId = this.addEntity(eEntityType.Character, {}, id, position);
        PacketHandler.game.players[id] = {
            ws,
            uid,
            entityId,
            id,
            goals: 0,
            assits: 0,
            team,
            skinId,
            bot,
            experience,
            name,
        }
        return [id, entityId];
    }
    getPlayer(id) {
        let flag = (typeof id).toLowerCase() == "string";
        try {
            if (flag) return Object.values(PacketHandler.game.players).find(l => l.uid == id);
            else PacketHandler.game.players[id];
        } catch {
            console.log("couldn't find the player");
            return null;
        }
    }
    removePlayer(id) {
        this.removeEntity(PacketHandler.game.players[id].entityId);
        delete PacketHandler.game.players[id];
    }
    formatEntitiesDictionary() {
        let list = [];
        Object.values(PacketHandler.game.entities).forEach(({ id, entityType, forces, playerId, position, rotation }) => list.push({ id, entity: { entityType, forces, playerId, position, rotation } }))
        return list;
    }
    formatPlayersDictionary() {
        let list = [];
        Object.values(PacketHandler.game.players).forEach(({ id, goals, assits, team, skinId, bot, experience, name }) => {
            list.push({ id, goals, assits, team, skinId, bot, experience, name })
        })
        return list;
    }

    addEntity(entityType, forces = {}, playerId = 0, position = { x: 0, z: 0 }, rotation = 0) {
        const id = PacketHandler.ids[1]++;
        PacketHandler.game.entities[id] = {
            id,
            entityType,
            forces,
            playerId,
            position,
            rotation
        }
        return id;
    }
    getEntity(id) {
        return PacketHandler.game.entities[id]
    }
    removeEntity(id) {
        delete PacketHandler.game.entities[id];
    }

    SendPack(Pack) {
        this.ws.send(new Packet().SerializePack(Pack));
    }
    SendPackAll(Pack) {
        Object.values(PacketHandler.game.players).forEach(l => {
            if (l.ws.readyState === WebSocket.OPEN) l.ws.send(new Packet().SerializePack(Pack));
        })
    }
    addFunction(id, func) {
        PacketHandler.Functions[id] = func;
    }
    removeFunction(id) {
        delete PacketHandler.Functions[id];
    }
    InitializeGame() {
        if (!PacketHandler.game.started) {
            if (PacketHandler.Interval) (clearInterval(PacketHandler.Interval), PacketHandler.Interval = null);
            PacketHandler.game = {
                started: true,
                players: {},
                entities: {},
                gamestate: {
                    gameState: eGameState.Warmup,
                    timeRemaining: 0,
                    teams: [
                        { teamId: 0, score: 1 },
                        { teamId: 1, score: 1 }
                    ]
                },
            }
            this.addEntity(eEntityType.Powerup, {}, 0, { x: -9.100000381469727, z: 25.600000381469727 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: 24.5, z: -8.600000381469727 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: -1.4700000286102295, z: 16.399999618530273 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: 22.81999969482422, z: 7.579999923706055 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: -9.100000381469727, z: -8.600000381469727 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: 16.530000686645508, z: -1.690000057220459 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: 24.5, z: 25.600000381469727 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: 16.799999237060547, z: 16.399999618530273 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: -1.4700000286102295, z: -1.690000057220459 });
            this.addEntity(eEntityType.Powerup, {}, 0, { x: -7.519999980926514, z: 7.449999809265137 });


            PacketHandler.Functions = {};
            PacketHandler.Interval = setInterval(() => {
                let Pack = [];
                Object.values(PacketHandler.Functions).forEach(l => l());
                Object.values(PacketHandler.game.entities).forEach(entity => {
                    if (entity.moving) {
                        Pack.push({
                            id: ePacketID.Transform,
                            data: {
                                id: entity.id,
                                position: entity.position,
                                rotation: entity.rotation
                            }
                        })
                    }
                })
                if (Pack.length > 0) this.SendPackAll(Pack);
            }, 50)
        }
    }
    OnDisconnect() {
        this.Disconnected = true;
        if (this.id) this.removePlayer(this.id);
    }
    OnMessage(message) {
        let packet = new Packet(new Uint8Array(message)).Deserialize();
        console.log(packet);
        switch (packet.id) {
            case ePacketID.Chat:
                this.SendPack([{
                    id: ePacketID.Chat,
                    data: packet.data
                }]);
                break;
            case ePacketID.Authenticate:
                let { version, skinId, authenticationMethod, name, uid } = packet.data;
                if (this.getPlayer(uid)) {
                    this.ws.close();
                    let player = this.getPlayer(uid);
                    console.log("Player with same account connected", player);
                    player.ws.close();
                } else {
                    let player = this.addPlayer(this.ws, uid, 1, skinId, false, 1000, name, { x: 0, z: 0 });
                    this.id = player[0];
                    this.entityId = player[1];
                    this.addFunction(this.entityId, () => {
                        const speed = this.config.speed;
                        if (this.entityId && !this.Disconnected) {
                            let { x, z, boost } = this.command;
                            let entity = this.getEntity(this.entityId);
                            entity.moving = !(x == 0 && z == 0)
                            if (x || z) {
                                entity.rotation += z * (speed / 3.5);

                                entity.position.x += (boost ? speed + 1 : speed) * x * Math.cos(entity.rotation + Math.PI / 2);
                                entity.position.z += (boost ? speed + 1 : speed) * x * Math.sin(entity.rotation + Math.PI / 2);
                            }
                        }
                    });

                    this.SendPack([
                        {
                            id: ePacketID.Initialize,
                            data: {
                                playerId: this.id,
                                entities: {
                                    list: this.formatEntitiesDictionary()
                                },
                                players: {
                                    list: this.formatPlayersDictionary()
                                },
                                gameState: {
                                    "gameState": 1,
                                    "timeRemaining": 148.9058837890625,
                                    "teams": [
                                        {
                                            "teamId": 0,
                                            "score": 1
                                        },
                                        {
                                            "teamId": 1,
                                            "score": 1
                                        }
                                    ]
                                },
                                hostName: this.hostName
                            }
                        }
                    ]);
                }
                break;
            case ePacketID.Command: {
                let { idSource: id, position: direction, command } = packet.data;
                if (this.entityId != id) (this.ws.close(), this.getPlayer(this.uid).ws.close());
                else {
                    let { x, z } = direction;
                    x ??= 0; z ??= 0;
                    x = Math.sign(x);
                    z = Math.sign(z);
                    this.command = { x, z, boost: command == eCommandType.Boost }
                }
            }
                break;
        }

    }

}
class PacketsInterval {
    constructor() {
        this.functions = {};
        this.Interval = setInterval(l => {
            Object.values(this.functions).forEach(l => l());
        }, 50)
    }
    AddFunction(id, func) {
        this.functions[id] = func;
    }
}

function CreatWebSocketServer(port) {
    const speed = 0.2;
    const wss = new WebSocket.Server({ port });
    console.log('WebSocket server is running on ws://localhost:' + port);

    //let GameStateManager_ = new GameStateManager(5 * 60);

    wss.on('connection', (ws) => {
        let PacketHandler_ = new PacketHandler(ws);
        ws.on('message', (message) => {
            PacketHandler_.OnMessage(message);
        });
        ws.on('close', () => {
            PacketHandler_.OnDisconnect();
        });
        ws.on('error', (error) => {
            console.error(`WebSocket error: ${error}`);
        });
    });

}

module.exports = CreatWebSocketServer;

