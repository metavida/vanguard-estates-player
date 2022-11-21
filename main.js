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

    storyEl.querySelector("h2").textContent = name;
    const imgEl = storyEl.querySelector("img");
    imgEl.setAttribute("src", story.image.src);
    imgEl.setAttribute("alt", story.image.alt);

    const audioEl = storyEl.querySelector(".player iframe");
    audioEl.setAttribute("data-src", megaphoneUrl(story.audio));

    // TODO: add text reader

    const childrenEl = storyEl.querySelector(".children");
    const childrenList = childrenEl.querySelector("ol");
    if (children.length) {
      children.forEach((childId) =>
        renderStoryNavLink({ storyId: childId, parentEl: childrenList })
      );
    } else {
      const endEl = document.createElement("p");
      endEl.textContent = "The End";
      childrenEl.prepend(endEl);

      renderStoryNavLink({
        storyId: 1,
        parentEl: childrenList,
        className: "restart",
      });
    }
    parent &&
      renderStoryNavLink({
        storyId: parent,
        parentEl: childrenList,
        className: "back",
      });
  } else {
    storyEl.classList.add("hidden");
  }

  parentEl.append(storyEl);
};

const megaphoneUrl = ({ url }) => {
  const [_, megaphoneId] =
    url.match(/traffic\.megaphone\.fm\/([^\/]+)\.mp3/) || [];
  return `https://playlist.megaphone.fm?e=${megaphoneId}`;
};

const renderStoryNavLink = ({ storyId, parentEl, className }) => {
  const listEl = document.createElement("li");
  listEl.setAttribute("value", storyId);
  if (className) {
    listEl.classList.add(className);
  }
  const storyLink = document.createElement("a");
  storyLink.setAttribute("href", `#view-story-${storyId}`);
  storyLink.addEventListener("click", (event) =>
    focusStory({ storyId: storyId, event })
  );
  const linkText = document.createElement("span");
  linkText.textContent = allStories[storyId].name;

  storyLink.append(linkText);
  listEl.append(storyLink);
  parentEl.append(listEl);
};

const initialFocus = () => {
  const [_, storyId] = window.location.hash?.match(/#view-story-(\d+)/) || [];
  if (storyId) {
    focusStory({ storyId, noHistory: true });
  } else {
    window.scrollTo(0, 0);
  }
};

const focusStory = ({ storyId, event, noHistory }) => {
  event?.preventDefault();

  document.querySelector(".focused")?.classList.remove("focused");
  const storyEl = document.getElementById(`story-${storyId}`);

  const audioEl = storyEl.querySelector(".player iframe");
  if (audioEl.getAttribute("src") !== audioEl.dataset.src) {
    audioEl.setAttribute("src", audioEl.dataset.src);
    audioEl.removeAttribute("srcdoc");
  }

  storyEl.classList.add("focused");

  storyEl.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });

  if (!noHistory) {
    window.history.pushState({ storyId }, "", `#view-story-${storyId}`);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  render();
  initialFocus();
  window.addEventListener("popstate", initialFocus);
});
