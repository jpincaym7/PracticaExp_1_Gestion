from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.academico.validators import (
    validate_nombre_no_vacio,
    validate_nombre_sin_caracteres_especiales,
    validate_longitud_minima_nombre,
    validate_nombre_alfanumerico,
)


class TestValidateNombreNoVacio(TestCase):
    def test_valor_valido(self):
        validate_nombre_no_vacio("Presencial")

    def test_cadena_vacia(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_nombre_no_vacio("")
        self.assertEqual(ctx.exception.code, "nombre_vacio")

    def test_solo_espacios(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_nombre_no_vacio("   ")
        self.assertEqual(ctx.exception.code, "nombre_vacio")

    def test_none(self):
        with self.assertRaises(ValidationError):
            validate_nombre_no_vacio(None)


class TestValidateNombreSinCaracteresEspeciales(TestCase):
    def test_nombre_valido(self):
        validate_nombre_sin_caracteres_especiales("Ingeniería de Software")

    def test_corchete_angulo(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_nombre_sin_caracteres_especiales("Hack<script>")
        self.assertEqual(ctx.exception.code, "caracteres_invalidos")

    def test_corchete_cuadrado(self):
        with self.assertRaises(ValidationError):
            validate_nombre_sin_caracteres_especiales("Test[inject]")

    def test_barra_invertida(self):
        with self.assertRaises(ValidationError):
            validate_nombre_sin_caracteres_especiales("path\\file")

    def test_llave(self):
        with self.assertRaises(ValidationError):
            validate_nombre_sin_caracteres_especiales("{json}")


class TestValidateLongitudMinimaНombre(TestCase):
    def test_longitud_valida(self):
        validate_longitud_minima_nombre("Ing")

    def test_dos_caracteres(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_longitud_minima_nombre("AB")
        self.assertEqual(ctx.exception.code, "nombre_muy_corto")

    def test_un_caracter(self):
        with self.assertRaises(ValidationError):
            validate_longitud_minima_nombre("A")

    def test_espacios_no_cuentan(self):
        with self.assertRaises(ValidationError):
            validate_longitud_minima_nombre("  A  ")


class TestValidateNombreAlfanumerico(TestCase):
    def test_solo_letras(self):
        validate_nombre_alfanumerico("Presencial")

    def test_letras_con_espacios(self):
        validate_nombre_alfanumerico("Ingeniería de Software")

    def test_tildes(self):
        validate_nombre_alfanumerico("Tecnología en Administración")

    def test_enie(self):
        validate_nombre_alfanumerico("Diseño Gráfico")

    def test_numeros_invalidos(self):
        with self.assertRaises(ValidationError) as ctx:
            validate_nombre_alfanumerico("Modalidad123")
        self.assertEqual(ctx.exception.code, "nombre_invalido")

    def test_guion_invalido(self):
        with self.assertRaises(ValidationError):
            validate_nombre_alfanumerico("Semi-presencial")

    def test_punto_invalido(self):
        with self.assertRaises(ValidationError):
            validate_nombre_alfanumerico("Version 2.0")
