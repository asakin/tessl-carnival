import './style.css';
import { applyTheme, bestScore, type CarnivalGame } from './carnival';
import { registry } from './games';
import { startMidway } from './midway/midway';
import { gameName, getActiveSkin, listSkins, setActiveSkin } from './midway/skins';
import type { BoothSlot } from './midway/world';
import { carnivalLink, REPO_URL, shareLinks } from './share';

applyTheme();

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

function bestText(game: CarnivalGame): string {
  const best = bestScore(game.id);
  return best === undefined ? 'No scores yet' : `Best: ${best}`;
}

function renderMidway() {
  document.body.dataset.view = 'midway';
  app.innerHTML = `
    <section class="midway">
      <canvas class="midway-map" aria-label="The carnival midway. Walk up to a booth to play its game."></canvas>
      <p class="midway-help">
        <kbd>WASD</kbd> or <kbd>arrows</kbd> to walk, or click where you want to go.
        <kbd>E</kbd> to play.
      </p>
      <p class="midway-credit">
        Built with
        <a href="https://tessl.io/?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">Tessl</a>
        at
        <a href="https://tessl.io/devcon?utm_source=carnival&amp;utm_medium=midway-credit&amp;utm_campaign=tessl-carnival" target="_blank" rel="noopener">AI DevCon NYC</a>
        <span class="midway-links">
          <a href="${REPO_URL}" target="_blank" rel="noopener">Build your own</a>
          <span class="midway-share" hidden>
            · Share on
            <a class="share-x" target="_blank" rel="noopener">X</a>
            or
            <a class="share-linkedin" target="_blank" rel="noopener">LinkedIn</a>
          </span>
        </span>
      </p>
      <nav class="midway-guide" aria-label="Booths">
        <h2>Booths</h2>
        <ul></ul>
        <div class="midway-skins" role="group" aria-label="Skins">
          <h2>Skins</h2>
        </div>
      </nav>
      <div class="booth-card" aria-live="polite" hidden>
        <h2></h2>
        <p class="description"></p>
        <p class="best"></p>
        <a class="play">Play</a>
      </div>
    </section>`;

  const link = carnivalLink(location.href);
  if (link) {
    const share = shareLinks(link);
    app.querySelector<HTMLAnchorElement>('.share-x')!.href = share.x;
    app.querySelector<HTMLAnchorElement>('.share-linkedin')!.href = share.linkedIn;
    app.querySelector<HTMLElement>('.midway-share')!.hidden = false;
  }

  const guide = app.querySelector('.midway-guide ul')!;
  const guideNames = registry.all().map((game) => {
    const item = document.createElement('li');
    item.innerHTML = `<a href="#/play/${game.id}"><span class="name"></span> <span class="best"></span></a>`;
    item.querySelector('.best')!.textContent = bestText(game);
    guide.append(item);
    return { game, name: item.querySelector('.name')! };
  });

  const skinPicker = app.querySelector('.midway-skins')!;
  const skinButtons = listSkins().map((skin) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = skin.name;
    button.addEventListener('click', () => {
      setActiveSkin(skin.id);
      showActiveSkin();
    });
    skinPicker.append(button);
    return { id: skin.id, button };
  });
  const card = app.querySelector<HTMLElement>('.booth-card')!;
  let reached: BoothSlot | undefined;
  const showActiveSkin = () => {
    const active = getActiveSkin().id;
    for (const { id, button } of skinButtons)
      button.setAttribute('aria-pressed', `${id === active}`);
    for (const { game, name } of guideNames) name.textContent = gameName(game);
    if (reached) showBooth(reached);
  };
  const showBooth = (booth: BoothSlot | undefined) => {
    reached = booth;
    const game = booth?.gameId ? registry.get(booth.gameId) : undefined;
    card.hidden = booth === undefined;
    card.classList.toggle('closed', booth !== undefined && !game);
    card.querySelector('h2')!.textContent = game ? gameName(game) : 'Coming soon';
    card.querySelector('.description')!.textContent =
      game?.description ?? 'This booth is waiting for a game. Build one and it opens here.';
    card.querySelector('.best')!.textContent = game ? bestText(game) : '';
    const link = card.querySelector<HTMLAnchorElement>('.play')!;
    link.hidden = !game;
    if (game) link.href = `#/play/${game.id}`;
  };

  showActiveSkin();

  const midway = startMidway(app.querySelector('canvas')!, {
    games: registry.all(),
    onPlay: (gameId) => (location.hash = `#/play/${gameId}`),
    onReach: showBooth,
  });
  stop = midway.stop;
}

function renderGame(game: CarnivalGame) {
  document.body.dataset.view = 'game';
  app.innerHTML = `
    <section class="game">
      <div class="game-header">
        <a href="#/">← Back to the midway</a>
        <h1></h1>
      </div>
      <canvas></canvas>
    </section>`;
  app.querySelector('h1')!.textContent = gameName(game);
  stop = game.start(app.querySelector('canvas')!);
}

function route() {
  stop?.();
  stop = undefined;

  const match = location.hash.match(/^#\/play\/([\w-]+)$/);
  const game = match ? registry.get(match[1]) : undefined;
  if (game) renderGame(game);
  else renderMidway();
}

window.addEventListener('hashchange', route);
route();
