const postCache = {};

document.addEventListener("DOMContentLoaded", async () => {
  document.title = SITE_CONFIG.title;
  document.getElementById("site-title").textContent = SITE_CONFIG.title;
  document.getElementById("site-bio").textContent = SITE_CONFIG.bio;
  document.getElementById("github-link").href = `https://github.com/${SITE_CONFIG.githubUser}`;
  document.getElementById("footer-text").textContent = `© ${new Date().getFullYear()} ${SITE_CONFIG.author}`;

  document.getElementById("site-title").onclick = showHome;
  document.getElementById("home-link").onclick = (e) => { e.preventDefault(); showHome(); };
  document.getElementById("back-btn").onclick = showHome;

  const toggleBtn = document.getElementById("theme-toggle");
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
  toggleBtn.onclick = () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  };

  const projectsList = document.getElementById("projects-list");
  if (!SITE_CONFIG.projects.length) {
    document.getElementById("projects-section").classList.add("hidden");
  } else {
    SITE_CONFIG.projects.forEach(p => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = p.link;
      card.target = p.link === "#" ? "_self" : "_blank";
      card.innerHTML = `
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="tags">${p.tech.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      `;
      projectsList.appendChild(card);
    });
  }

  await loadPostList();

  if (window.location.hash) {
    openPost(decodeURIComponent(window.location.hash.slice(1)));
  }
});

async function loadPostList() {
  const postsList = document.getElementById("posts-list");
  const apiUrl = `https://api.github.com/repos/${SITE_CONFIG.githubUser}/${SITE_CONFIG.repoName}/contents/posts`;

  try {
    const res = await fetch(apiUrl);
    const files = await res.json();
    const mdFiles = files
      .filter(f => f.name.endsWith(".md"))
      .sort((a, b) => b.name.localeCompare(a.name)); // 依檔名日期新到舊排序

    for (const file of mdFiles) {
      const rawRes = await fetch(file.download_url);
      const rawText = await rawRes.text();

      const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : "";
      const titleMatch = rawText.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : file.name.replace(".md", "");
      const body = rawText.replace(/^#\s+.+\n?/, "");

      postCache[file.name] = { title, date, body };

      const li = document.createElement("li");
      li.innerHTML = `
        <a href="#${file.name}">
          <span class="post-item-title">${title}</span>
          <span class="post-item-meta">${date}</span>
        </a>
      `;
      li.querySelector("a").onclick = (e) => {
        e.preventDefault();
        openPost(file.name);
      };
      postsList.appendChild(li);
    }
  } catch (err) {
    postsList.innerHTML = `<li style="color:var(--muted)">目前尚無文章，或倉庫尚未公開。</li>`;
  }
}

function openPost(fileName) {
  const post = postCache[fileName];
  if (!post) return;

  history.pushState(null, "", `#${encodeURIComponent(fileName)}`);
  document.getElementById("post-title").textContent = post.title;
  document.getElementById("post-date").textContent = post.date;
  document.getElementById("post-content").innerHTML = marked.parse(post.body);
  document.querySelectorAll("#post-content pre code").forEach(el => hljs.highlightElement(el));

  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("post-view").classList.remove("hidden");
  window.scrollTo(0, 0);
}

function showHome() {
  history.pushState(null, "", window.location.pathname);
  document.getElementById("post-view").classList.add("hidden");
  document.getElementById("home-view").classList.remove("hidden");
}
