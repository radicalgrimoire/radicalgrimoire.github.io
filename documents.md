---
title: "Documents"
permalink: "/documents/"
layout: docs-index
description: "技術に関する手順や資料をまとめています。"
---

{% assign docs = site.docs | sort: "order" %}
{% assign category_count = 0 %}
{% for doc in docs %}{% if doc.category_index == true %}{% assign category_count = category_count | plus: 1 %}{% endif %}{% endfor %}
<section class="docs-overview" aria-labelledby="docs-categories-heading">
  <div class="docs-section-label"><h2 id="docs-categories-heading">Browse by category</h2><span>{{ category_count }} categories</span></div>
  <ul class="docs-directory">
    {% for doc in docs %}
      {% if doc.category_index == true %}
        {% assign category = doc.categories | first %}
        {% capture doc_count %}{% include docs-category-count.html docs=docs category=category %}{% endcapture %}
        <li><a href="{{ doc.url | relative_url }}">
          <i class="bi bi-folder2" aria-hidden="true"></i>
          <span class="docs-category-text"><strong>{{ doc.title | escape }}</strong>{% if doc.description %}<span>{{ doc.description | escape }}</span>{% endif %}</span>
          <span class="docs-count">{{ doc_count }} docs</span><span class="docs-list-arrow" aria-hidden="true">›</span>
        </a></li>
      {% endif %}
    {% endfor %}
  </ul>
</section>