shader_type canvas_item;
void fragment() {
	vec4 pixel = texture(TEXTURE, UV);
	COLOR = vec4(vec3(1.0) - pixel.rgb, pixel.a);
}
