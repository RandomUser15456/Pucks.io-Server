const {ePacketID} = require("./constants")



class MessageParser {
    static ArrayOp = 10;
    constructor(array = []) {
        this.array = [...array];
        this.index = 0;
    }

    get leftBytes() {
        return this.array.length - this.index;
    }

    readByte() {
        return this.array[this.index++];
    }

    read(size) {
        this.index += size;
        return this.array.slice(this.index - size, this.index);
    }

    readFloat() {
        return new Float32Array(new Uint8Array(this.read(4)).buffer)[0];
    }

    readVarInt() {
        let result = 0;
        let shift = 0;
        while (shift < 35) {
            const byte = this.readByte();
            result |= (byte & 127) << shift;
            if ((byte & 128) === 0) return result;
            shift += 7;
        }
        throw new Error('Invalid varint encoding');
    }

    readString() {
        const len = this.readVarInt();
        return new TextDecoder().decode(new Uint8Array(this.read(len)));
    }

    writeByte(byte) {
        this.array.push(byte & 0xFF);
    }

    write(bytes) {
        this.array.push(...bytes);
    }

    writeFloat(value) {
        const floatBytes = new Uint8Array(new Float32Array([value]).buffer);
        this.write(floatBytes);
    }

    writeVarInt(value) {
        while (true) {
            if ((value & ~0x7F) === 0) {
                this.writeByte(value);
                break;
            } else {
                this.writeByte((value & 0x7F) | 0x80);
                value >>>= 7;
            }
        }
    }

    writeString(str) {
        const encoded = new TextEncoder().encode(str);
        this.writeVarInt(encoded.length);
        this.write(encoded);
    }

    readDictionary(params, length = -1) {
        const dataLen = length > 0 ? length : this.readVarInt();
        const stream = new MessageParser(this.read(dataLen));
        const result = {};
        Object.values(params).forEach(l=>{
          if( l[1].includes("int") ) result[l[0]] = 0;
          else if( l[1].includes("bool") ) result[l[0]] = false;
        })
        while (stream.leftBytes > 0) {
            const key = stream.readByte();
            const param = params[key];
            if (!param) throw new Error(`Undefined key name of ${key}`);
            if (param[1] == "array") {
                if (!result[param[0]]) result[param[0]] = [stream.readDictionary(param[2])];
                else result[param[0]].push(stream.readDictionary(param[2]));
            } else {
                let value = null;
                switch (param[1]) {
                    case "int":
                    case "uint":
                        value = stream.readVarInt();
                        break;
                    case "float":
                        value = stream.readFloat();
                        break;
                   case "bool":
                        value = !!stream.readByte();
                        break;
                    case "string":
                        value = stream.readString();
                        break;
                    case "dict":
                        value = stream.readDictionary(param[2]);
                        break;
                }
                result[param[0]] = value;
            }
        }
        return result;
    }

    writeArray(value) {
        value.forEach(l => {
            this.writeByte(MessageParser.ArrayOp);
            this.writeVarInt(l.length);
            this.write(l);
        })
    }

    writeDictionary(json, params, writeLen = 1) {
        const stream = new MessageParser();
        Object.entries(json).forEach(([n, value]) => {
            let entry = Object.entries(params).find(l => l[1][0] == n);
            if (!entry) throw Error("No entry found for " + n);
            let type = entry[1][1];
            let key = Number(entry[0]);
            if (type == "array") {
                value.forEach(l => {
                    stream.writeByte(key);
                    stream.writeDictionary(l, entry[1][2]);
                });
            } else if ("uintbool".includes(type)&&!!value===false) {} else {
                stream.writeByte(key);
                switch (type) {
                    case "int":
                    case "uint":
                        stream.writeVarInt(value);
                        break;
                   case "bool":
                        stream.writeByte(value?1:0);
                        break;
                    case "float":
                        stream.writeFloat(value);
                        break;
                    case "string":
                        stream.writeString(value);
                        break;
                    case "dict":
                        stream.writeDictionary(value, entry[1][2]);
                        break;
                }
            }
        })
        if(writeLen) this.writeVarInt(stream.array.length);
        this.write(stream.array);
    }

    deserialize(params) {
        try {
            return this.readDictionary({
                8: ["id", "uint"],
                18: ["data", "dict", params],
            }, this.array.length);
        } catch (error) {
            return {
                error, parser: this, params
            }
        }
    }

    serialize(json, params) {
        try {
            this.writeDictionary(json, {
                8: ["id", "uint"],
                18: ["data", "dict", params],
            }, this.array.length,false);
            return this.array;
        } catch (error) {
            throw Error(error);
            return {
                error, parser: this, params
            }
        }
    }

    UnPack() {
        let pack = [];
        while (this.leftBytes>0) {
          this.readByte();
          let len = this.readVarInt();
          pack.push(this.read(len));
        }
       return pack;
    }
    Pack(key,packs) {
        packs.forEach(l=>{
         this.writeByte(key);
         this.writeVarInt(l.length);
         this.write(l)
        })
    }
}

class Packet extends MessageParser {
    static PlayerRecordUpdate = {
        10: ["player","dict",{
          10: ["uid","string"],
          34: ["name","string"],
          72: ["key72","int"],
          88: ["key88","int"],
        }]
    }
    static Connection = {
        10: ["list", "array", {
            8: ["id", "int"],
            18: ["name", "string"],
            56: ["bot", "bool"],
            24: ["goals", "uint"],
            32: ["assits", "uint"],
            40: ["team", "uint"],
            48: ["skinId", "uint"],
            64: ["experience", "uint"],
        }]
    }
    static Initialize = {
        10: ["entities", "dict", {
            10: ["list", "array", {
                8: ["id", "int"],
                18: ["entity", "dict", {
                    10: ["position", "dict", {
                        13: ["x", "float"],
                        21: ["z", "float"],
                    }],
                    16: ["entityType", "uint"],
                    24: ["playerId", "uint"],
                    37: ["rotation", "float"],
                    42: ["forces", "dict", {
                        13: ["x", "float"],
                        21: ["z", "float"],
                    }],
                }],
            }],
        }],
        18: ["players", "dict", {
            10: ["list", "array", {
            8: ["id", "int"],
            18: ["name", "string"],
            56: ["bot", "bool"],
            24: ["goals", "uint"],
            32: ["assits", "uint"],
            40: ["team", "uint"],
            48: ["skinId", "uint"],
            64: ["experience", "uint"],
            }]
        }],
        24: ["playerId", "uint"],
        34: ["gameState", "dict", {
            13: ["timeRemaining", "float"],
            18: ["teams", "array", {
                8: ["teamId", "int"],
                16: ["score", "int"],
            }],
            24: ["gameState", "int"],
        }],
        42: ["hostName", "string"]
    }
    static PlayerEvent = {
        16: ["playerId", "uint"],
    }
    static Modify = {
        16: ["id", "uint"],
        26: ["entity", "dict", {
            10: ["position", "dict", {
                13: ["x", "float"],
                21: ["z", "float"],
            }],
            16: ["entityType", "uint"],
            24: ["playerId", "uint"],
            37: ["rotation", "float"],
            42: ["forces", "dict", {
                13: ["x", "float"],
                21: ["z", "float"],
            }],
        }],
    }
    static Destroy = {
        8: ["id", "uint"],
        24: ["reason", "uint"],
        18: ["entity", "dict", {
            10: ["position", "dict", {
                13: ["x", "float"],
                21: ["z", "float"],
            }],
            24: ["playerId", "uint"],
            16: ["entityType", "uint"],
            37: ["rotation", "float"],
            42: ["forces", "dict", {
                13: ["x", "float"],
                21: ["z", "float"],
            }],
        }],
    }
    static UpdatePlayers = {
            10: ["list", "array", {
            8: ["id", "int"],
            18: ["name", "string"],
            56: ["bot", "bool"],
            24: ["goals", "uint"],
            32: ["assits", "uint"],
            40: ["team", "uint"],
            48: ["skinId", "uint"],
            64: ["experience", "uint"],
            }],
    }
    static Announcement = {
        10: ["message", "string"],
        16: ["playerIdA", "uint"],
        24: ["playerIdB", "uint"],
    }
    static Gamestate = {
        13: ["timeRemaining", "float"],
        18: ["teams", "array", {
            8: ["teamId", "int"],
            16: ["score", "int"],
        }],
        24: ["gameState", "int"],
    }
    static ChangeTeam = {
        8: ["team", "uint"],
        16: ["id", "uint"],
    }
    static Disconnection = {
        8: ["playerId", "uint"],
    }
    static Transform = {
        8: ["id", "uint"],
        18: ["position", "dict", {
            13: ["x", "float"],
            21: ["z", "float"]
        }],
        29: ["rotation", "float"],
    }
    static Authenticate = {
        10: ["name", "string"],
        18: ["uid", "string"],
        24: ["version", "uint"],
        32: ["skinId", "uint"],
        42: ["password", "string"],
        48: ["tokenId", "string"],
        56: ["authenticationMethod", "uint"],
    }
    static Chat = {
        8: ["playerId", "uint"],
        18: ["message", "string"],
    }
    static Command = {
        8: ["command", "uint"],
        18: ["position", "dict", {
            13: ["x", "float"],
            21: ["z", "float"],
        }],
        24: ["idSource", "uint"],
        32: ["idTarget", "uint"],
    }
    constructor(buffer = []) {
        super(buffer);
    }
    DeserializePack() {
      let g = [];
      let stream = new MessageParser(this.array);
      stream.UnPack().forEach(l=>g.push(new Packet(l).Deserialize()))
      return g;
    }
    SerializePack(pack) {
      let pack_ = [];
      pack.forEach(l=>pack_.push(new Packet().Serialize(l)));
      this.Pack(10,pack_);
      return new Uint8Array(this.array);
    }
    Deserialize() {
        let id = ePacketID[this.array[1]];
        if(!id) return this.array;
        return this.deserialize(Packet[id]);
    }
    Serialize(json) {
        let id = ePacketID[json.id];
        if(!id) return [];
        return new Uint8Array(this.serialize(json, Packet[id]));
    }
}


module.exports = {MessageParser,Packet}