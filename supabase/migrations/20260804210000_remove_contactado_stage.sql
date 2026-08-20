UPDATE sponsors
SET
  estado = 'Propuesta enviada',
  proxima_accion = CASE
    WHEN COALESCE(proxima_accion, '') = '' OR proxima_accion ILIKE '%contacto por email%'
      THEN 'Dar seguimiento a la propuesta enviada'
    ELSE proxima_accion
  END
WHERE estado = 'Contactado';

UPDATE asistentes_potenciales
SET
  estado = 'Invitación enviada',
  proxima_accion = CASE
    WHEN COALESCE(proxima_accion, '') = ''
      THEN 'Dar seguimiento a la invitación'
    ELSE proxima_accion
  END
WHERE estado = 'Contactado';
