# Norris Lab website

Static Jekyll site for the Norris Lab (Department of Biochemistry, University of Toronto).
GitHub Pages builds it automatically, so no local tooling is needed to publish.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**, choose **Deploy from a branch**, and select `main` / `(root)`.
3. If the site is served from a project repository (`https://<user>.github.io/<repo>/`),
   set `baseurl: "/<repo>"` in `_config.yml`. For a `<user>.github.io` repository or a custom domain, leave it empty.

## Edit content

| What | Where |
| --- | --- |
| Publications | `_data/publications.yml` (newest first; `featured: true` puts a paper in the top strip) |
| Lab members and alumni | `_data/people.yml` (photos go in `assets/img/`) |
| Contact details, links | `_config.yml` |
| Research text, PI bio, joining info | `index.html` |
| Colours and type | variables at the top of `assets/css/style.css` |
| Hero animation | `assets/js/lattice.js` |

Publication titles link to a PubMed search unless you add a `url:` (e.g. a DOI link).

## Preview locally

```sh
bundle install
bundle exec jekyll serve
```
