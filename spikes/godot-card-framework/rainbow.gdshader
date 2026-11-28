shader_type canvas_item;

void fragment() {
	vec4 source = texture(TEXTURE, UV);
	float light = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
	float hue = fract(0.965 + dot(UV, vec2(0.43, 0.48)));
	vec3 spectrum = clamp(abs(fract(hue + vec3(1.0, 0.6667, 0.3333)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
	vec3 dye = mix(vec3(1.0), spectrum, 0.88);
	// Keep the portrait's shadows and highlights while recoloring its surface.
	vec3 shaded = mix(dye * min(light * 1.5, 1.0), vec3(1.0), smoothstep(0.55, 1.0, light) * 0.76);
	COLOR = vec4(shaded, source.a);
}
