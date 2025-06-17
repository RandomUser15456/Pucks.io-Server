

document.addEventListener("DOMContentLoaded", function () {
    document.onmousedown = () => window.focus();
    var minimum_build_version = -1;
    var server_status = "ONLINE";
    var custom_message = "";
    var unity_config
    function UpdateUnityConfig(Type) {
        var buildUrl = "Build/" + Type;
        unity_config = {
            loaderUrl: buildUrl + "/loader.js",
            dataUrl: buildUrl + "/Game.data",
            frameworkUrl: buildUrl + "/framework.js",
            codeUrl: buildUrl + "/Game.wasm",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "Use Map Settings",
            productName: "Pucks.io",
            productVersion: "1.8",
        };
    }
    var canvas = document.getElementById("unity-canvas");

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    var auth_user = null;
    var authentication_token = "";
    var id_token = "";
    var anonymous_user = "1";
    var anonymousUser;
    var gameInstance = null;
    var player_name = "";
    var game_initialized = false;

    const UI = {
        "anon_button": document.querySelector("#anon_button"),
        "login": document.querySelector("#login"),
        "game-type": document.querySelector("#game-type"),
        "play-button": document.querySelector("#play-button"),
        "template": document.querySelector("#template"),
        "car": document.querySelector("#car"),
        "ball": document.querySelector("#ball"),
        "mainwebcontent": document.querySelector("#mainwebcontent"),
        "sign-up": document.querySelector("#sign-up"),
        "discordlink": document.querySelector("#discordlink"),
    }
    UI["login"].Ftype = "login"
    UI["login"].querySelector("#sign-up").addEventListener("click", function () {
        if (UI["login"].Ftype == "sign-up") {
            UI["login"].Ftype = "login";
            UI["login"].querySelector("#sign-btn").textContent = "Login";
            UI["login"].querySelector("#sign-up").textContent = "Don't have an account? Sign up here.";
        } else {
            UI["login"].Ftype = "sign-up";
            UI["login"].querySelector("#sign-btn").textContent = "Sign Up";
            UI["login"].querySelector("#sign-up").textContent = "Already have an account? Login here.";
        }
    });
    UI["login"].querySelector("#sign-btn").addEventListener("click", async function () {
        let Ftype = UI["login"].Ftype;
        let username = UI["login"].querySelector("#username").value;
        let password = UI["login"].querySelector("#password").value;
        console.log("Action:", Ftype, username, password);
        const response = await fetch(Ftype == "login" ? '/api/Login' : '/api/Signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        console.log(data)
        if (data.Result == "OK") {
            window.location.reload();
        } else {
            UI["login"].querySelector("#login-error").style.display = '';
            UI["login"].querySelector("#login-error").textContent = data.Reason;
        }

    });
    UI["login"].querySelector("#closer").addEventListener("click", function () {
        window.location.reload();
        // UI["login"].style.display = 'none';
        //UI["mainwebcontent"].style.display = '';
        //FocusCanvasExternal("0");
    });
    //UI["anon_button"].addEventListener("click",loginAnonymously);
    UI["login"].addEventListener("keydown", enterNameSkip);
    UI["game-type"].addEventListener("change", GameTypeChange);
    UI["play-button"].addEventListener("click", OnPlayClicked);

    window.UI = UI;

    function GameTypeChange() {
        let type = UI["game-type"].value;
        UI.ball.src = "./TemplateData/" + (type == "Pucks" ? "puck" : "ball") + ".png"
        UI.car.src = "./TemplateData/car_" + (type == "Pucks" ? "blue" : "red") + ".png"
        UI.template.className = "template " + type;
        UpdateUnityConfig(UI["game-type"].value);
    }
    GameTypeChange();
    function GetConfig() {
        fetch_('/api/GetConfig', {
            method: 'GET',
            headers: {
                'Content-type': 'text/plain'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(response => {
                UI["discordlink"].href = response.discord;
                UI["discordlink"].style.display = '';
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }
    GetConfig();
    function OnPlayClicked() {
        fetch_('/api/GetPlayerRecord', {
            method: 'GET',
            headers: {
                'Content-type': 'text/plain'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(response => {
                if (response != null && response.last_name !== "") {
                    if (!response.isGuest) anonymous_user = "0";
                    authentication_token = response.Uid;
                    SetPlayerName(response.last_name);
                    UI["mainwebcontent"].style.display = 'none';
                    loadGame();
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }
    function loadGame() {

        document.getElementById("auth").style.display = 'none';
        if (gameInstance == null) {
            document.getElementById("loadingcontainer").style.display = '';

            var script = document.createElement("script");
            script.src = unity_config.loaderUrl;
            script.onload = () => {
                createUnityInstance(canvas, unity_config, (progress) => {
                    document.getElementById("progressBar").style.width = (200.0 * progress) + "px";
                }).then((unityInstance) => {
                    gameInstance = unityInstance;
                    window.gameInstance = gameInstance;


                    gameInstance.SendMessage('NetworkLayer', 'SetAccountAnnonymousExternal', anonymous_user);
                    gameInstance.SendMessage('NetworkLayer', 'SetAccountExternal', authentication_token + "|" + id_token);
                    gameInstance.SendMessage('GameCanvas', 'SetPlayerNameExternal', player_name);

                    document.getElementById("gameContainer").style.display = '';
                }).catch((message) => {
                    alert(message);
                });
            };
            document.body.appendChild(script);

        } else {
            showNameWindow();
        }
    }
    function setName() {
        player_name = document.getElementById("username").value;
        if (player_name == null || typeof (player_name) != "string") {
            player_name = "";
        }

        gameInstance.SendMessage('NetworkLayer', 'SetAccountAnnonymousExternal', anonymous_user);
        gameInstance.SendMessage('NetworkLayer', 'SetAccountExternal', authentication_token + "|" + id_token);
        gameInstance.SendMessage('GameCanvas', 'SetPlayerNameExternal', player_name);
        document.getElementById("mainwebcontent").style.display = 'none';
        //document.getElementById('TextInputReceiver').focus()
        FocusCanvasExternal("1");
    }
    function loginAnonymously() {
        showNameWindow();
    }
    function showNameWindow() {
        document.getElementById("login").style.display = '';
        document.getElementById("auth").style.display = 'none';
        document.getElementById("mainwebcontent").style.display = '';
        document.getElementById("username").focus();
    }
    function SetPlayerName(external_player_name) {
        if (external_player_name == null || typeof (external_player_name) != "string") {
            external_player_name = "";
        }
        player_name = external_player_name;

    }
    function UnityProgress(gameObject, progress) {
        if (!gameObject.Module)
            return;
        if (progress == "complete") {
            document.getElementById("gameContainer").style.display = '';
            return;
        }
        document.getElementById("progressBar").style.width = (200.0 * progress) + "px";
    }
    function OnClickChangeName() {
        showNameWindow();
    }
    function OnClickLogin() {
        UI["login"].style.display = 'flex';
        UI["mainwebcontent"].style.display = '';
    }
    async function OnClickLogout() {
        console.log("OnClickLogout");
        //await window.cookieStore.delete("Uid");
        //window.location.reload();
        fetch_('/api/Logout/', {
            method: 'POST',
            headers: {
                'Content-type': 'text/plain'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(response => {
                if (response.Result == "OK") {
                    window.location.reload();
                } else {
                    alert("Error logging out");
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }
    function GameInitializedExternal(client_version) {
        game_initialized = true;

        document.getElementById("gameContainer").style.display = '';
        document.getElementById("loadingcontainer").style.display = 'none';
        document.getElementById("car").style.display = 'none';
        document.getElementById("ball").style.display = 'none';

        if (server_status != "ONLINE") {
            document.getElementById("alertMessage").innerHTML = "Server is down for maintenance";
            document.getElementById("alert").style.display = '';
        } else if (client_version && minimum_build_version >= 0 && minimum_build_version > client_version) {
            document.getElementById("alertMessage").innerHTML = "Client out of date. Please 'hard' refresh";
            document.getElementById("alert").style.display = '';
        } else if (custom_message && custom_message != "") {
            document.getElementById("alertMessage").innerHTML = custom_message;
            document.getElementById("alert").style.display = '';
        } else {
            //showNameWindow();
        }

        gameInstance.SendMessage('NetworkLayer', 'SetAccountAnnonymousExternal', anonymous_user);
        gameInstance.SendMessage('NetworkLayer', 'SetAccountExternal', authentication_token + "|" + id_token);
    }
    function FocusCanvasExternal(focus) {
        if (game_initialized) gameInstance.SendMessage("GameCanvas", "FocusCanvasExternal", focus);
    }
    function enterNameSkip(event) {
        let g = true
        if (event.keyCode == 13) (g = false, setName());
        return g;
    };



    document.getElementById("username").value = "";
    player_name = "";




    window.OnClickLogout = OnClickLogout;
    window.GameInitializedExternal = GameInitializedExternal;
    window.OnClickLogin = OnClickLogin;

    document.addEventListener('click', function (e) {
        if (e.target.id == "gameContainer" || e.target.id == "unity-canvas" || e.target.id == "#unity-canvas") FocusCanvasExternal("1");
        else FocusCanvasExternal("0");
    });


});