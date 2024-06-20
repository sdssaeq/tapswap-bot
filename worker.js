const { workerData, parentPort } = require("worker_threads");
const axios = require("axios");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`);
// Extract the document and window objects from the DOM
const { document, window } = dom.window;

if (!window.ctx) {
  window.ctx = {};
}

if (!window.ctx.api) {
  window.ctx.api = {};
}

const api = {
  setHeaders: function (data) {
    window.ctx.api.headers = data;
    return data;
  },
  getHeaders: function (key) {
    // Retrieves headers or performs actions related to getting headers
    return window.ctx.api.headers[key] || "No headers set";
  },
};
window.ctx.api = api;

// Now you can manipulate the DOM as if you were in a browser
const div = document.createElement("div");
div.id = "_chr_";
document.body.appendChild(div);

var config = JSON.parse(fs.readFileSync("config.json", "utf8"));
let isVerified = [];
let accessToken,
  currentEnergy,
  currentTapPower,
  currentBoost,
  currentEnergyBoost,
  currentChargeLevel,
  currentEnergyLevel,
  currentTapLevel,
  currentMission,
  username,
  uid,
  coins,
  claim;

const yellow = "\x1b[33m"; // ANSI code for yellow
const red = "\x1b[31m";
const green = "\x1b[32m";
const reset = "\x1b[0m"; // ANSI code to reset color

let isTurbo = false;
let isTokenValid = true;
let isConnectWallet = false;
let isLogin = false;
let isError = false;
let isTapBotActive;
let lastTurboActivationTime = 0;
let x_cv = "629";
let app_bot = "app_bot_3";
let priceUpgrade;

const url = [
  "https://api.tapswap.ai/api/account/login",
  "https://api.tapswap.ai/api/player/submit_taps",
  "https://api.tapswap.ai/api/player/apply_boost", //{"type":"energy"}
  "https://api.tapswap.ai/api/player/claim_reward",
  "https://api.tapswap.ai/api/missions/join_mission", //{"id":"M0"}
  "https://api.tapswap.ai/api/missions/finish_mission", //{"id":"M0"}
  "https://api.tapswap.ai/api/missions/finish_mission_item", //{"id":"M0","itemIndex":1} {"id":"M0","itemIndex":2}
  "https://api.tapswap.ai/api/player/upgrade", //{"type":"tap"} {"type":"energy"} {"type":"charge"}
];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hs(userid, ctime) {
  return (userid * ctime) % userid;
}

function execute(value) {
  const len = value.length,
    bytes = new Uint8Array(len / 2),
    x = 157;
  for (let R = 0; R < len; R += 2)
    bytes[R / 2] = parseInt(value.substring(R, R + 2), 16);
  const xored = bytes.map((R) => R ^ x),
    decoded = new TextDecoder().decode(xored);
  return decoded;
}

function getTapHead(userid, ctime) {
  const headers = {
    Authorization: "Bearer " + accessToken,
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 7.1.2; SM-G955N Build/NRD90M.G955NKSU1AQDC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.131 Mobile Safari/537.36",
    "X-App": "tapswap_server",
    "X-Cv": x_cv,
    "X-Bot": "no",
    "Content-Id": hs(userid, ctime),
  };
  return headers;
}

function getHeaders() {
  const headers = accessToken
    ? {
        Authorization: "Bearer " + accessToken,
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 7.1.2; SM-G955N Build/NRD90M.G955NKSU1AQDC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.131 Mobile Safari/537.36",
        "X-App": "tapswap_server",
        "X-Cv": x_cv,
        "X-Bot": "no",
      }
    : {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 7.1.2; SM-G955N Build/NRD90M.G955NKSU1AQDC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.131 Mobile Safari/537.36",
        "X-App": "tapswap_server",
        "X-Cv": x_cv,
        "X-Bot": "no",
        // "Cache-Id": window.ctx.api.getHeaders("Cache-Id"),
      };
  return headers;
}

async function request(url, data, headers) {
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (err) {
    // console.log(err.response.data);
    // parentPort.postMessage(`cant Request ${err.response.status} Server Down`);
    isError = true;
  }
}

async function joinMission() {
  try {
    // const {
    //   account: { missions },
    // } =
    await axios.post(url[4], { id: "M0" }, { headers: getHeaders() });
    // currentMission = missions;
    parentPort.postMessage(`Joined Mission ${id}`);
  } catch (error) {
    parentPort.postMessage(`${error} joinMission func`);
  }
}

async function finishMission() {
  try {
    // const {
    //   account: { missions },
    // } =
    // currentMission = missions;
    await axios.post(url[5], { id: "M0" }, { headers: getHeaders() });
    parentPort.postMessage("Completed Mission");
  } catch (error) {
    parentPort.postMessage(`${error} finishMission func`);
  }
}

async function doneMission(itemindex) {
  try {
    // const {
    //   account: { missions },
    // } =
    await axios.post(
      url[6],
      { id: "M0", itemIndex: itemindex },
      { headers: getHeaders() }
    );
    // currentMission = missions;
    parentPort.postMessage(`Finished Mission ${itemindex}`);
  } catch (error) {
    parentPort.postMessage(`${error} doneMission func`);
    // currentMission = [];
  }
}

async function Login(queryid) {
  try {
    const getChr = {
      init_data: queryid,
      referrer: "",
      bot_key: app_bot,
    };

    const { chq } = await request(url[0], getChr, getHeaders());
    const k = execute(chq);
    const chr = eval(k);

    const Loginpayload = {
      init_data: queryid,
      referrer: "",
      bot_key: app_bot,
      chr: chr,
    };

    const res = await request(url[0], Loginpayload, {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 7.1.2; SM-G955N Build/NRD90M.G955NKSU1AQDC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/92.0.4515.131 Mobile Safari/537.36",
      "X-App": "tapswap_server",
      "X-Cv": x_cv,
      "X-Bot": "no",
      "Cache-Id": window.ctx.api.getHeaders("Cache-Id"),
    });

    if (!res || !res.access_token || !res.player || !res.conf || !res.account) {
      return;
    }

    const {
      access_token,
      player: {
        energy,
        tap_level,
        boost,
        full_name,
        id,
        tap_bot,
        charge_level,
        energy_level,
      },
      conf: { energy_levels, charge_levels, tap_levels },
      account: { missions },
    } = res;
    username = full_name;
    uid = id;
    accessToken = access_token;
    currentEnergy = energy;
    currentTapPower = tap_level;
    currentBoost = boost && boost.length > 1 ? boost[1].cnt : 0;
    currentMission = missions;
    currentChargeLevel = charge_level;
    currentEnergyLevel = energy_level;
    isTapBotActive = tap_bot;
    priceUpgrade = [
      { type: "energy_levels", value: energy_levels },
      { type: "charge_levels", value: charge_levels },
      { type: "tap_levels", value: tap_levels },
    ];
    isTokenValid = true;
    isLogin = true;
    parentPort.postMessage("Success Login");
  } catch (err) {
    parentPort.postMessage(`${err} Failed Login`);
    isError = true;
    isLogin = false;
  }
}

async function upgradeBang(upgradeType) {
  try {
    await axios.post(url[7], { type: upgradeType }, { headers: getHeaders() });
    parentPort.postMessage(`Upgrade ${upgradeType}`);
  } catch (error) {
    parentPort.postMessage(`Cant Upgrade ${upgradeType} ${error}`);
  }
}

async function claimReward(taskID) {
  try {
    await axios.post(url[3], { task_id: taskID }, { headers: getHeaders() });
    parentPort.postMessage(`Reward Claimed ${taskID}`);
  } catch (error) {
    parentPort.postMessage(`Reward Error ${taskID}`);
  }
}

async function GetEnergy() {
  try {
    await axios.post(url[2], { type: "energy" }, { headers: getHeaders() });
    parentPort.postMessage("Energy activated!");
  } catch (err) {
    console.error("Error activating Energy:", err);
  }
}

async function Turbo() {
  if (!isTurbo) {
    return;
  }
  const currentTime = Date.now();
  const turboCooldown = 20000; // Turbo cooldown time in milliseconds

  if (currentTime - lastTurboActivationTime < turboCooldown) {
    return;
  }

  try {
    await axios.post(url[2], { type: "turbo" }, { headers: getHeaders() });
    isTurbo = false;
    lastTurboActivationTime = currentTime;
    parentPort.postMessage("Turbo activated!");
  } catch (err) {
    console.error("Error activating turbo:", err);
  }
}

async function Taps(taps) {
  if (isError) {
    return;
  }
  if (currentEnergy > currentTapPower) {
    try {
      const currentTimestamp = Date.now();
      const { data } = await axios.post(
        url[1],
        { taps: taps, time: currentTimestamp },
        {
          headers: getTapHead(uid, currentTimestamp),
        }
      );
      const {
        player: {
          shares,
          energy,
          boost,
          claims,
          charge_level,
          tap_level,
          energy_level,
          tap_bot,
        },
      } = data;
      coins = shares;
      currentEnergy = energy;
      currentTapLevel = tap_level;
      currentChargeLevel = charge_level;
      currentEnergyLevel = energy_level;
      isTapBotActive = tap_bot;
      currentBoost = boost && boost.length > 1 ? boost[1].cnt : 0;
      currentEnergyBoost = boost && boost.length > 1 ? boost[0].cnt : 0;
      claim = claims;

      parentPort.postMessage(
        `${yellow}${username}${reset} | duit: ${yellow}${coins}${reset} | taps: ${yellow}${taps}+${reset} | energy: ${yellow}${currentEnergy}${reset} | Boost: ${yellow}${currentBoost}${reset} | Wallet: ${
          !isConnectWallet ? red : green
        }${isConnectWallet}${reset}`
      );
    } catch (err) {
      parentPort.postMessage(`${err.response.status} server currently Down`);
      if (err.response.status === 401) {
        isTokenValid = false;
      } else {
        isError = true;
      }
    }
  } else {
    parentPort.postMessage("No Energy");
    currentEnergy++;
  }

  if (config.autoBuyTapBot) {
    if (!isTapBotActive && coins > 200000) {
      try {
        upgradeBang("tap_bot");
      } catch (error) {}
    }
  }

  if (config.autobuy) {
    if (
      currentChargeLevel <= config.maxUpgradeChargeLevel &&
      coins > priceUpgrade[1].value[currentChargeLevel].price
    ) {
      upgradeBang("charge");
    }

    if (
      currentTapLevel <= config.maxUpgradeTapLevel &&
      coins > priceUpgrade[2].value[currentTapLevel].price
    ) {
      upgradeBang("tap");
    }

    if (
      currentEnergyLevel <= config.maxUpgradeEnergyLevel &&
      coins > priceUpgrade[0].value[currentEnergyLevel].price
    ) {
      upgradeBang("energy");
    }
  }

  if (!currentMission && isLogin) {
    joinMission();
  }
  if (currentMission && currentMission.completed) {
    const foundElement = currentMission.completed.find(
      (element) => element === "M3"
    );
    if (foundElement) {
      isConnectWallet = true;
    } else {
      isConnectWallet = false;
    }
  }

  if (
    currentMission &&
    Array.isArray(currentMission.active) &&
    currentMission.active.length > 0
  ) {
    if (currentMission.active[0].id === "M0") {
      for (let i = 0; i < 3; i++) {
        isVerified[i] = currentMission.active[0].items[i].verified;
      }
    }
  }

  if (isVerified.length > 0) {
    if (isVerified.every((status) => status === true)) {
      finishMission();
    } else {
      await doneMission(0);
      await doneMission(1);
      await doneMission(2);
    }
  }

  if (claim && claim.length > 0) {
    parentPort.postMessage("Reward Claimed");
    claimReward(claim[0].toString());
  }

  if (currentEnergyBoost > 0 && currentEnergy < 100) {
    await GetEnergy();
  }

  if (currentBoost > 0) {
    isTurbo = true;
    await Turbo();
  } else {
    isTurbo = false;
  }

  while (isTurbo) {
    const currentTime = Date.now();
    const turboCooldown = 20000; // Turbo cooldown time in milliseconds
    if (currentTime - lastTurboActivationTime > turboCooldown) {
      parentPort.postMessage("Turbo Breaked");
      isTurbo = false;
      if (currentBoost > 0) {
        currentBoost -= 1;
      }
      break;
    }

    // const { data } =
    await axios.post(
      url[1],
      { taps: config.boost_taps, time: currentTime },
      { headers: getTapHead(uid, currentTime) }
    );
    // const {
    //   player: { shares },
    // } = data;
    // parentPort.postMessage(`BOOSTING: ${shares}`);
  }

  isTurbo = false;
}

async function main() {
  await Login(workerData);
  while (true) {
    if (isError) {
      break;
    }
    if (!isTokenValid) {
      await Login(workerData);
      isTokenValid = true;
    }
    try {
      await Taps(getRandomInt(1, currentEnergy / (1 + currentTapPower)));
    } catch (error) {
      parentPort.postMessage(`ERROR: ${error}`);
    }
    await delay(config.delay);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
