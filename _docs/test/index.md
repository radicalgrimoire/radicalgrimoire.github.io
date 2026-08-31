---
title: "実装機能テスト"
layout: page
order: 999
categories: [test]
category_index: true
---

{% assign docs = site.docs | sort: "order" %}
{% if docs.size > 0 %}
<ul class="archive">
{% for doc in docs %}
	{% assign category = doc.categories | first %}
	{% if category == "test" and doc.url != page.url %}
	<li>
		<a href="{{ doc.url | relative_url }}">{{ doc.title }}</a>
		{% if doc.description %}<span class="archive-taxonomies">{{ doc.description }}</span>{% endif %}
	</li>
	{% endif %}
{% endfor %}
</ul>
{% endif %}