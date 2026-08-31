---
title: "Docs"
permalink: "/documents/"
layout: page
---

{% assign docs = site.docs | sort: "order" %}
{% if docs.size > 0 %}
<ul class="archive">
{% for doc in docs %}
  {% if doc.category_index == true %}
  <li>
    <a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
    {% if doc.description %}<span class="archive-taxonomies">{{ doc.description }}</span>{% endif %}
  </li>
  {% endif %}
{% endfor %}
</ul>
{% endif %}