---
title: "Perforce"
layout: page
order: 1
categories: [perforce]
category_index: true
permalink: /1-perforce/
---

# Documents

{% assign docs = site.docs | sort: "order" %}
{% if docs.size > 0 %}
<ul class="archive">
{% for doc in docs %}
  {% assign category = doc.categories | first %}
  {% if category == "perforce" and doc.url != page.url %}
  <li>
    <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
    {% if doc.description %}<span class="archive-taxonomies">{{ doc.description }}</span>{% endif %}
  </li>
  {% endif %}
{% endfor %}
</ul>
{% endif %}

# Official Documentation

* [HelixCore Server Administrator Guide](https://www.perforce.com/perforce/doc.current/manuals/p4sag/Content/P4SAG/Home-p4sag.html)
  * [Linux package-based installation](https://www.perforce.com/perforce/doc.current/manuals/p4sag/Content/P4SAG/install.linux.packages.install.html)
  * [Upgrading the server](https://www.perforce.com/manuals/p4sag/Content/P4SAG/chapter.upgrade.html)
* [Setting up a commit/edge server environment](https://community.perforce.com/s/article/8008)
* [Installing Helix Authentication Service](https://www.perforce.com/manuals/helix-auth-svc/Content/HAS/install-has.html#Package_installation_overview)

# GitHub Repositories

* [Helix Authentication Service](https://github.com/perforce/helix-authentication-service)
* [Helix Authentication Extension](https://github.com/perforce/helix-authentication-extension)