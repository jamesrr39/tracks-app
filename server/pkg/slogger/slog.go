package slogger

import "log/slog"

var Slogger = SLogger{}

type SLogger struct{}

func (SLogger) Info(message string, args ...interface{}) {
	slog.Info(message, args)
}

func (SLogger) Warn(message string, args ...interface{}) {
	slog.Warn(message, args)
}
func (SLogger) Error(message string, args ...interface{}) {
	slog.Error(message, args)
}
