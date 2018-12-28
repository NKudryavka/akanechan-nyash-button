import anime from 'animejs';

const AKANE = encodeURIComponent('茜ちゃんかわいい！！！！！');
const TOKEN = encodeURIComponent(btoa(Math.random)).slice(24);
const API_URL = 'https://script.google.com/macros/s/AKfycbws6Yt3rB_gUau3RktvwE0Wl55BFjFBFSapmLGsZX4LSMvFFoE/exec';

window.AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const gravityA = 2 + Math.sqrt(3);
const gravityB = - 1 - Math.sqrt(3);
anime.easings['gravity'] = (t) => {
    return gravityA * t * t + gravityB * t;
}

async function fetchSounds() {
    const sounds = [
        'sound/maekawa.mp3',
        'sound/nyaaaa.mp3',
        'sound/nyasc.mp3',
        'sound/nyaweak.mp3',
        'sound/unya-long.mp3',
        'sound/unya-short.mp3',
    ];
    const responses = await Promise.all(sounds.map((p) => fetch(p)));
    const buffers = await Promise.all(responses.map((r) => r.arrayBuffer()));
    return Promise.all(buffers.map((buf) => {
        return new Promise((resolve, reject) => audioContext.decodeAudioData(buf, resolve));
    }));
}

function random(n) {
    return Math.floor(Math.random()*n)
}

class Sender {
    constructor() {
        this.waitFrom = Number.MAX_SAFE_INTEGER;
        this.count = 0;
        setInterval(() => {
            if (Date.now() - this.waitFrom > 1000) {
                this.send();
            }
        }, 100);
    }

    countUp() {
        this.count++;
        this.waitFrom = Date.now();
    }

    send() {
        const count = this.count;
        this.count = 0;
        this.waitFrom = Number.MAX_SAFE_INTEGER;
        if (!count) return;
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            },
            body: `token=${TOKEN}&akane=${AKANE}&count=${count}`,
        })
        // .then((res) => res.json())
        // .then((res) => {
        // })
        .catch(console.log);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const button = document.getElementById('button');
    const push = button.getElementsByClassName('push')[0];
    const pops = Array.from(document.getElementById('akane-pops').children);
    const body = document.getElementsByTagName('body')[0];
    const globalCounter = document.getElementById('global-counter');
    const localCounter = document.getElementById('local-counter');
    const twitterButton = document.getElementById('twitter-button');
    const sender = new Sender();

    let count = 0;

    const sounds = await fetchSounds();

    const siteUrl = encodeURIComponent('https://nkudryavka.github.io/akanechan-nyash-button/');
    const hashtags = 'Akanechan_Nyash_Button,' + encodeURIComponent('茜ちゃん絶対主人公にするからね');
    function getTweetUrl() {
        const content = encodeURIComponent(`Akanechan Nyash Buttonで茜ちゃんを${count}回注文したよ！`);
        return `https://twitter.com/intent/tweet?text=${content}&url=${siteUrl}&hashtags=${hashtags}`;
    }

    let refreshCount = null;
    function refreshGlobalCount() {
        if (count === refreshCount) return;
        fetch(`${API_URL}?akane=${AKANE}`)
        .then((res) => res.json())
        .then((res) => {
            globalCounter.textContent = res.count.toLocaleString();
            refreshCount = count;
        });
    }
    refreshGlobalCount();
    setInterval(refreshGlobalCount, 10*1000);

    function nya() {
        audioContext.resume();
        const pop = (Math.random() < 0.7 ? pops[0] : pops[random(pops.length)]).cloneNode();
        countUp();
        const source = audioContext.createBufferSource();
        source.buffer = sounds[Math.random() < 0.99 ? random(sounds.length-1)+1 : 0];
        source.connect(audioContext.destination);
        source.start(0);
        
        pop.style.position = 'absolute';
        pop.style.maxWidth = '20%';
        pop.style.maxHeight = '20%';
        pop.style.top = '30%';
        pop.style.left = '40%';
        pop.style.zIndex = -1;
        button.appendChild(pop);
        const popAnime = anime({
            targets: pop,
            translateX: {
                value: (Math.random()-0.5) * body.clientWidth,
                easing: 'linear',
            },
            translateY: {
                value: body.clientHeight * (Math.random() * 0.5 + 0.5),
                easing: 'gravity'
            },
            duration: 1500,
        });
        popAnime.complete = () => {
            pop.remove();
        }
    }

    function countUp() {
        count++;
        sender.countUp();
        localCounter.textContent = count.toLocaleString();
        twitterButton.href = getTweetUrl();
    }

    const buttonDarken = () => {
        push.style.fill = '#ccc';
    }
    const buttonLighten = () => {
        push.style.fill = '';
    }
    
    push.addEventListener('touchstart', (e) => {
        e.preventDefault();
        buttonDarken();
    })
    push.addEventListener('touchend', (e) => {
        e.preventDefault();
        buttonLighten();
        nya();
    });
    push.addEventListener('mousedown', buttonDarken);
    push.addEventListener('mouseleave', buttonLighten);
    push.addEventListener('mouseup', () => {
        buttonLighten();
        nya();
    });

    window.addEventListener('beforeunload', (e) => {
        sender.send();
    });
});