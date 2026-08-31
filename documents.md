---
title: "Docs"
permalink: "/documents/"
layout: page
---

{% assign docs = site.docs | sort: "order" %}
{% if docs.size > 0 %}
<ul class="archive">
{% for doc in docs %}
  <li>
    <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
    {% if doc.description %}<span class="archive-taxonomies">{{ doc.description }}</span>{% endif %}
  </li>
{% endfor %}
</ul>
{% endif %}