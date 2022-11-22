import { storyLayers, allStories } from "./story.js";

const currentStorySteps = [1, 2];

if ("content" in document.createElement("template")) {
  console.log("A supported browser!");
} else {
  console.warn("Need to polyfill template cloning?");
}

const render = () => {
  const header = document.querySelector("header");
  const main = document.querySelector("main");

  const getStartedLink = header.querySelector(".start a");
  getStartedLink.addEventListener("click", (event) =>
    focusStory({ storyId: 1, event })
  );
  const getAboutLink = document.querySelector("footer a");
  getAboutLink.addEventListener("click", (event) => focusAbout({ event }));

  storyLayers.forEach((basicStories, index) => {
    const stories = basicStories.map(({ id }) => allStories[id]);
    renderRow({
      stories,
      parentEl: main,
      index,
    });
  });
};

const renderRow = ({ stories, parentEl, index }) => {
  const rowEl = document.createElement("div");
  rowEl.setAttribute("id", `row-${index}`);
  rowEl.classList.add("row");
  stories.forEach((story) => {
    renderStory({ story, parentEl: rowEl });
  });

  parentEl.append(rowEl);
};

const renderStory = ({ story, parentEl }) => {
  const storyEl = document.createElement("div");
  storyEl.classList.add("story");

  if (story.id) {
    const { id, name, children, parent } = story;
    storyEl.setAttribute("id", `story-${id}`);

    const cellTemp = document.getElementById("cell_template");
    storyEl.append(cellTemp.content.cloneNode(true));

    storyEl.querySelector("h2").textContent = `${id}. ${name}`;
    const imgEl = storyEl.querySelector("img");
    imgEl.setAttribute("src", story.image.src);
    imgEl.setAttribute("alt", story.image.alt);

    const audioEl = storyEl.querySelector(".player audio");
    audioEl.setAttribute("src", story.audio.url);
    audioEl.addEventListener("play", () => handlePlayStart({ audioEl }));

    // TODO: add text reader

    const childrenEl = storyEl.querySelector(".children");
    const childrenList = childrenEl.querySelector("ol");
    if (children.length) {
      children.forEach((childId) =>
        renderStoryNavLink({ storyId: childId, parentEl: childrenList })
      );
    } else {
      const endEl = childrenEl.querySelector("p");
      endEl.textContent = "The End";

      renderStoryNavLink({
        storyId: 1,
        parentEl: childrenList,
        className: "restart",
      });
    }
    if (parent) {
      renderStoryNavLink({
        storyId: parent,
        parentEl: childrenList,
        className: "back",
      });
    } else {
      renderAboutNavLink({
        parentEl: childrenList,
      });
    }
  } else {
    storyEl.classList.add("hidden");
  }

  parentEl.append(storyEl);
};

const handlePlayStart = ({ audioEl }) => {
  const prevAudioEl = document.querySelector(".playing");
  if (prevAudioEl) {
    prevAudioEl.classList.remove("playing");
    prevAudioEl.pause();
  }
  audioEl.classList.add("playing");
};

const renderNavLink = ({ parentEl, number, text, url, onClick, className }) => {
  const listEl = document.createElement("li");
  listEl.setAttribute("value", number);
  if (className) {
    listEl.classList.add(className);
  }
  const storyLink = document.createElement("a");

  storyLink.setAttribute("href", url);
  storyLink.addEventListener("click", onClick);
  const linkText = document.createElement("span");
  linkText.textContent = text;

  storyLink.append(linkText);
  listEl.append(storyLink);
  parentEl.append(listEl);
};
const renderStoryNavLink = ({ storyId, parentEl, className }) => {
  renderNavLink({
    parentEl,
    number: storyId,
    text: allStories[storyId].name,
    className,
    url: `#view-story-${storyId}`,
    onClick: (event) => focusStory({ storyId: storyId, event }),
  });
};
const renderAboutNavLink = ({ parentEl }) => {
  renderNavLink({
    parentEl,
    number: 1,
    text: "About this site",
    className: "back",
    url: "#about",
    onClick: (event) => focusAbout({ event }),
  });
};

const initialFocus = () => {
  const [_, storyId] = window.location.hash?.match(/#view-story-(\d+)/) || [];
  if (storyId) {
    focusStory({ storyId, noHistory: true });
  } else if (window.location.hash === "#about") {
    focusAbout({ noHistory: true });
  } else {
    window.scrollTo(0, 0);
  }
};

const scrollAndUpdateHistory = ({ event, targetEl, history }) => {
  event?.preventDefault();

  targetEl.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  if (history) {
    const { state, url } = history;
    window.history.pushState(state, "", url);
  }
};

const focusStory = ({ storyId, event, noHistory }) => {
  document.querySelector(".focused")?.classList.remove("focused");
  const storyEl = document.getElementById(`story-${storyId}`);

  const audioEl = storyEl.querySelector(".player audio");
  event && audioEl.play();

  storyEl.classList.add("focused");
  document.querySelector("footer").classList.remove("hidden");

  scrollAndUpdateHistory({
    event,
    targetEl: storyEl,
    history: noHistory
      ? null
      : { state: { storyId }, url: `#view-story-${storyId}` },
  });
};

const focusAbout = ({ event, noHistory }) => {
  document.querySelector("footer").classList.add("hidden");
  scrollAndUpdateHistory({
    event,
    targetEl: document.getElementById("about"),
    history: noHistory ? null : { url: "#about" },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  render();
  initialFocus();
  window.addEventListener("popstate", initialFocus);
});
