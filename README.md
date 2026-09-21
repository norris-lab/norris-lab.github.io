# Norris Lab website

Static Jekyll site for the Norris Lab (Department of Biochemistry, University of Toronto).
GitHub Pages builds it automatically, so no local tooling is needed to publish.

## Publish on GitHub Pages

The site is configured for **https://norris-lab.github.io** (`url` in `_config.yml`, empty `baseurl`).

1. Create a repository named exactly `norris-lab.github.io` under the `norris-lab` GitHub account or organisation, and push this folder to it.
2. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, and select `main` / `(root)`.
3. If you later move it to a project repository (`https://<user>.github.io/<repo>/`), set `baseurl: "/<repo>"`.

## Edit content

| What | Where |
| --- | --- |
| Publications | `_data/publications.yml` (newest first; full author lists and DOIs from PubMed) |
| Lab members and alumni | `_data/people.yml` (photos go in `assets/img/`) |
| Contact details, links | `_config.yml` |
| Research text, PI bio, joining info | `index.html` |
| Colours and type | variables at the top of `assets/css/style.css` |
| Hero animation | `assets/js/lattice.js` |

Publication titles link to their DOI. Research-section citations in the margin are written directly in `index.html`.

## Preview locally

```sh
bundle install
bundle exec jekyll serve
```
