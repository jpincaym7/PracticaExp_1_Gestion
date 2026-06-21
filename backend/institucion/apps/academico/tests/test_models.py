from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.academico.models import Modalidad, Carrera


class TestModalidadModel(TestCase):

    def test_crear_modalidad_valida(self):
        m = Modalidad(nombre="Presencial")
        m.save()
        self.assertEqual(Modalidad.objects.count(), 1)
        self.assertEqual(m.nombre, "Presencial")
        self.assertTrue(m.estado)

    def test_str_modalidad(self):
        m = Modalidad(nombre="Virtual")
        m.save()
        self.assertEqual(str(m), "Virtual")

    def test_nombre_invalido_muy_corto(self):
        with self.assertRaises(ValidationError):
            Modalidad(nombre="AB").save()

    def test_nombre_invalido_caracteres_especiales(self):
        with self.assertRaises(ValidationError):
            Modalidad(nombre="<XSS>").save()

    def test_nombre_invalido_numeros(self):
        with self.assertRaises(ValidationError):
            Modalidad(nombre="Modalidad123").save()

    def test_soft_delete(self):
        m = Modalidad(nombre="Presencial")
        m.save()
        pk = m.pk
        m.delete()
        self.assertEqual(Modalidad.objects.count(), 0)
        self.assertEqual(Modalidad.all_objects.filter(pk=pk).count(), 1)
        m.refresh_from_db()
        self.assertFalse(m.estado)

    def test_restore(self):
        m = Modalidad(nombre="Presencial")
        m.save()
        m.delete()
        self.assertEqual(Modalidad.objects.count(), 0)
        m.restore()
        self.assertEqual(Modalidad.objects.count(), 1)
        m.refresh_from_db()
        self.assertTrue(m.estado)

    def test_hard_delete(self):
        m = Modalidad(nombre="Presencial")
        m.save()
        pk = m.pk
        m.hard_delete()
        self.assertEqual(Modalidad.all_objects.filter(pk=pk).count(), 0)

    def test_nombre_strip(self):
        m = Modalidad(nombre="  Presencial  ")
        m.save()
        self.assertEqual(m.nombre, "Presencial")

    def test_timestamps_auto(self):
        m = Modalidad(nombre="Presencial")
        m.save()
        self.assertIsNotNone(m.created_at)
        self.assertIsNotNone(m.updated_at)


class TestCarreraModel(TestCase):

    def setUp(self):
        self.modalidad = Modalidad(nombre="Presencial")
        self.modalidad.save()

    def test_crear_carrera_valida(self):
        c = Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad)
        c.save()
        self.assertEqual(Carrera.objects.count(), 1)

    def test_str_carrera(self):
        c = Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad)
        c.save()
        self.assertEqual(str(c), "Ingeniería de Software - Presencial")

    def test_nombre_invalido_muy_corto(self):
        with self.assertRaises(ValidationError):
            Carrera(nombre="AB", modalidad=self.modalidad).save()

    def test_carrera_referencia_modalidad(self):
        c = Carrera(nombre="Ingeniería Civil", modalidad=self.modalidad)
        c.save()
        self.assertEqual(c.modalidad.nombre, "Presencial")

    def test_soft_delete_carrera(self):
        c = Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad)
        c.save()
        pk = c.pk
        c.delete()
        self.assertEqual(Carrera.objects.count(), 0)
        self.assertEqual(Carrera.all_objects.filter(pk=pk).count(), 1)

    def test_restore_carrera(self):
        c = Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad)
        c.save()
        c.delete()
        c.restore()
        self.assertEqual(Carrera.objects.count(), 1)

    def test_manager_solo_activos(self):
        c1 = Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad)
        c1.save()
        c2 = Carrera(nombre="Ingeniería Civil", modalidad=self.modalidad)
        c2.save()
        c1.delete()
        self.assertEqual(Carrera.objects.count(), 1)
        self.assertEqual(Carrera.all_objects.count(), 2)

    def test_related_name_carreras(self):
        Carrera(nombre="Ingeniería de Software", modalidad=self.modalidad).save()
        Carrera(nombre="Ingeniería Civil", modalidad=self.modalidad).save()
        self.assertEqual(self.modalidad.carreras.filter(estado=True).count(), 2)
